import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import OpenAI from "openai";
import { MOCK_BUSINESSES } from "@/data/mock-businesses";

const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || "";

const openai = new OpenAI({
  apiKey: apiKey || "dummy-key",
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

const CANDIDATE_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.7-flash",
  "gemini-3.6-flash"
];

interface ChatRequest {
  message: string;
  sessionId?: string;
  lang?: 'hy' | 'en' | 'ru';
  imageUrl?: string | null;
  userId?: string;
  userName?: string;
  userPhone?: string;
  userEmail?: string;
  userRole?: string;
  isBusinessUser?: boolean;
  isGuest?: boolean;
  user?: any;
}

interface ChatSession {
  step: 'conversation' | 'booking_location' | 'booking_cuisine' | 'booking_datetime' | 'booking_details' | 'booking_confirm' | 'select_business' | null;
  selectedBizId?: string;
  selectedBizName?: string;
  selectedLocationId?: string;
  selectedLocationName?: string;
  selectedLocationAddress?: string;
  selectedCuisine?: string;
  availableCuisines?: string[];
  selectedOfferName?: string;
  bookingDateTime?: string;
  bookingDetails?: string;
  lang?: 'hy' | 'en' | 'ru';
  messages: any[];
}

const getSessions = (): Map<string, ChatSession> => {
  if (!(global as any).aiSessions) {
    (global as any).aiSessions = new Map<string, ChatSession>();
  }
  return (global as any).aiSessions;
};

const detectLanguage = (text: string): 'hy' | 'en' | 'ru' => {
  if (/[\u0530-\u058F]/.test(text)) return 'hy';
  if (/[\u0400-\u04FF]/.test(text)) return 'ru';
  return 'en';
};

function transliterateHyToEn(str: string): string {
  const map: Record<string, string> = {
    'ա': 'a', 'բ': 'b', 'գ': 'g', 'դ': 'd', 'ե': 'e', 'զ': 'z', 'է': 'e', 'ը': 'y', 'թ': 't',
    'ժ': 'zh', 'ի': 'i', 'լ': 'l', 'խ': 'kh', 'ծ': 'ts', 'կ': 'k', 'հ': 'h', 'ձ': 'dz', 'ղ': 'gh',
    'ճ': 'ch', 'մ': 'm', 'յ': 'y', 'ն': 'n', 'շ': 'sh', 'ո': 'o', 'չ': 'ch', 'պ': 'p', 'ջ': 'j',
    'ռ': 'r', 'ս': 's', 'վ': 'v', 'տ': 't', 'ր': 'r', 'ց': 'ts', 'ու': 'u', 'փ': 'p', 'ք': 'k',
    'և': 'ev', 'օ': 'o', 'ֆ': 'f'
  };
  let res = str.toLowerCase();
  for (const [hy, en] of Object.entries(map)) {
    res = res.replaceAll(hy, en);
  }
  return res;
}

const CUISINE_DICTIONARY: Record<string, { hy: string; ru: string; en: string; keywords: string[] }> = {
  grill: {
    hy: "Գրիլ / Խորոված",
    ru: "Гриль / Шашлык",
    en: "Grill / BBQ",
    keywords: ["գրիլ", "խորոված", "ստեյք", "grill", "bbq", "steak", "шашлык", "стейк", "բարբեքյու"]
  },
  armenian: {
    hy: "Հայկական",
    ru: "Армянская",
    en: "Armenian",
    keywords: ["հայկական", "հայ", "armenian", "армянская", "армянский", "տոլմա", "քյաբաբ", "ղափամա"]
  },
  caucasian: {
    hy: "Կովկասյան",
    ru: "Кавказская",
    en: "Caucasian",
    keywords: ["կովկասյան", "կովկաս", "caucasian", "кавказская", "кавказский"]
  },
  georgian: {
    hy: "Վրացական",
    ru: "Грузинская",
    en: "Georgian",
    keywords: ["վրացական", "վրաստան", "georgian", "грузинская", "грузинский", "խաչապուրի", "խինկալի", "khachapuri", "khinkali"]
  },
  italian: {
    hy: "Իտալական",
    ru: "Итальянская",
    en: "Italian",
    keywords: ["իտալական", "իտալիա", "italian", "итальянская", "итальянский", "պիցցա", "պաստա", "pizza", "pasta"]
  },
  european: {
    hy: "Եվրոպական",
    ru: "Европейская",
    en: "European",
    keywords: ["եվրոպական", "եվրոպա", "european", "европейская", "европейский"]
  },
  asian: {
    hy: "Ասիական / Սուշի",
    ru: "Азиатская / Суши",
    en: "Asian / Sushi",
    keywords: ["ասիական", "սուշի", "ճապոնական", "չինական", "asian", "sushi", "japanese", "chinese", "суши", "азиатская", "японская", "китайская", "rolls", "ռոլլ"]
  },
  mexican: {
    hy: "Մեքսիկական",
    ru: "Мексиканская",
    en: "Mexican",
    keywords: ["մեքսիկական", "mexican", "мексиканская", "տակո", "բուրիտո", "taco", "burrito"]
  },
  seafood: {
    hy: "Ծովամթերք / Ձկնեղեն",
    ru: "Морепродукты / Рыба",
    en: "Seafood / Fish",
    keywords: ["ծովամթերք", "ձուկ", "իշխան", "սիգ", "seafood", "fish", "морепродукты", "рыба"]
  },
  fastfood: {
    hy: "Արագ սնունդ / Բուրգեր",
    ru: "Фастфуд / Бургеры",
    en: "Fast Food / Burgers",
    keywords: ["բուրգեր", "արագ սնունդ", "burger", "fast food", "бургер", "фастфуд", "շաուրմա", "shawarma"]
  }
};

const CUISINE_EMOJIS: Record<string, string> = {
  armenian: "🇦🇲",
  caucasian: "🏔️",
  georgian: "🇬🇪",
  italian: "🍕",
  grill: "🥩",
  european: "🌍",
  asian: "🍣",
  mexican: "🌮",
  seafood: "🦐",
  fastfood: "🍔"
};

function detectCuisine(text: string): { key: string; label: string } | null {
  const clean = text.toLowerCase().trim().replace(/[🇦🇲🏔️🇬🇪🍕🥩🌍🍣🌮🦐🍔🍽️]/gu, "").trim();
  for (const [key, val] of Object.entries(CUISINE_DICTIONARY)) {
    if (val.keywords.some(k => clean.includes(k) || clean === k)) {
      return { key, label: val.hy };
    }
  }
  return null;
}

function getBusinessCuisines(biz: any, offers: any[] = []): string[] {
  const cuisines = new Set<string>();

  offers.forEach(o => {
    if (o.cuisine) cuisines.add(o.cuisine.toLowerCase());
  });

  if (biz?.tags && Array.isArray(biz.tags)) {
    biz.tags.forEach((t: string) => {
      const detected = detectCuisine(t);
      if (detected) cuisines.add(detected.key);
      else cuisines.add(t.toLowerCase());
    });
  }

  const nameLower = (biz?.name || '').toLowerCase();
  const descLower = (biz?.description || '').toLowerCase();

  if (nameLower.includes('steak') || descLower.includes('steak')) {
    cuisines.add('grill');
    cuisines.add('european');
  }
  if (nameLower.includes('picante') || descLower.includes('mexican')) {
    cuisines.add('mexican');
    cuisines.add('european');
  }
  if (nameLower.includes('bakery') || nameLower.includes('garni')) {
    cuisines.add('armenian');
  }
  if (nameLower.includes('ivetiki') || nameLower.includes('barmeni') || nameLower.includes('vaspurakan') || nameLower.includes('yasaman')) {
    cuisines.add('armenian');
    cuisines.add('caucasian');
    cuisines.add('grill');
  }

  if (cuisines.size === 0) {
    cuisines.add('armenian');
    cuisines.add('caucasian');
    cuisines.add('grill');
  }

  return Array.from(cuisines);
}

interface ScheduleCheckResult {
  isOpen: boolean;
  isClosedDay?: boolean;
  isClosingSoon?: boolean;
  hoursLeft?: number;
  minutesLeft?: number;
  openTime: string;
  closeTime: string;
  requestedTimeStr: string;
  dayName?: string;
}

function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr) return null;
  const clean = timeStr.trim();
  const match = clean.match(/(\d{1,2})[:.](\d{2})/);
  if (match) {
    return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  }
  const hourOnly = clean.match(/^(\d{1,2})$/);
  if (hourOnly) {
    return parseInt(hourOnly[1], 10) * 60;
  }
  return null;
}

function checkBusinessSchedule(biz: any, dateTimeInput: string): ScheduleCheckResult {
  let defaultOpen = "10:00";
  let defaultClose = "23:00";

  let requestedDate: Date | null = null;
  let requestedHours = 20;
  let requestedMinutes = 0;
  let requestedTimeFormatted = "20:00";

  if (dateTimeInput.includes("T") || dateTimeInput.match(/\d{4}-\d{2}-\d{2}/)) {
    const cleanIso = dateTimeInput.replace(" ", "T");
    const parsed = new Date(cleanIso);
    if (!isNaN(parsed.getTime())) {
      requestedDate = parsed;
      requestedHours = parsed.getHours();
      requestedMinutes = parsed.getMinutes();
      requestedTimeFormatted = `${String(requestedHours).padStart(2, '0')}:${String(requestedMinutes).padStart(2, '0')}`;
    }
  } else {
    const timeMatch = dateTimeInput.match(/(\d{1,2})[:.](\d{2})/);
    if (timeMatch) {
      requestedHours = parseInt(timeMatch[1], 10);
      requestedMinutes = parseInt(timeMatch[2], 10);
      requestedTimeFormatted = `${String(requestedHours).padStart(2, '0')}:${String(requestedMinutes).padStart(2, '0')}`;
      requestedDate = new Date();
    } else {
      const hourMatch = dateTimeInput.match(/\b(\d{1,2})\s*(?:-ին|ին|օր|ժամ|:00)?\b/);
      if (hourMatch) {
        requestedHours = parseInt(hourMatch[1], 10);
        requestedMinutes = 0;
        requestedTimeFormatted = `${String(requestedHours).padStart(2, '0')}:00`;
        requestedDate = new Date();
      }
    }
  }

  if (!requestedDate) requestedDate = new Date();
  const dayOfWeek = requestedDate.getDay();

  let openTime = defaultOpen;
  let closeTime = defaultClose;
  let isClosedDay = false;
  let dayName = "";

  const opHours = Array.isArray(biz?.operatingHours) 
    ? biz.operatingHours 
    : (Array.isArray(biz?.metadata?.operatingHours) ? biz.metadata.operatingHours : null);

  if (opHours && opHours.length > 0) {
    const todayOp = opHours.find((h: any) => h.day === dayOfWeek);
    if (todayOp) {
      dayName = todayOp.dayName || "";
      if (todayOp.isClosed) {
        isClosedDay = true;
      } else {
        if (todayOp.openTime) openTime = todayOp.openTime;
        if (todayOp.closeTime) closeTime = todayOp.closeTime;
      }
    }
  } else {
    const strHours = biz?.workingHours || biz?.metadata?.workingHours || biz?.schedule;
    if (typeof strHours === 'string' && strHours.includes("-")) {
      const parts = strHours.split("-").map((s: string) => s.trim());
      if (parts[0]) openTime = parts[0];
      if (parts[1]) closeTime = parts[1];
    }
  }

  if (isClosedDay) {
    return {
      isOpen: false,
      isClosedDay: true,
      openTime,
      closeTime,
      requestedTimeStr: requestedTimeFormatted,
      dayName
    };
  }

  const openMins = parseTimeToMinutes(openTime) ?? 600;
  let closeMins = parseTimeToMinutes(closeTime) ?? 1380;
  let reqMins = requestedHours * 60 + requestedMinutes;

  if (closeMins <= openMins || closeTime === "00:00" || closeTime === "24:00") {
    if (closeTime === "00:00" || closeTime === "24:00") {
      closeMins = 1440;
    } else {
      closeMins += 1440;
    }
  }

  if (reqMins < openMins && (reqMins + 1440) < closeMins) {
    reqMins += 1440;
  }

  if (reqMins < openMins || reqMins >= closeMins) {
    return {
      isOpen: false,
      isClosedDay: false,
      openTime,
      closeTime,
      requestedTimeStr: requestedTimeFormatted,
      dayName
    };
  }

  const minutesLeft = closeMins - reqMins;
  const hoursLeft = Math.round((minutesLeft / 60) * 10) / 10;
  const isClosingSoon = minutesLeft <= 180;

  return {
    isOpen: true,
    isClosingSoon,
    hoursLeft,
    minutesLeft,
    openTime,
    closeTime,
    requestedTimeStr: requestedTimeFormatted,
    dayName
  };
}

const systemPrompt = `You are Treeo AI, an intelligent, natural, charming, and versatile assistant.

Guidelines:
1. Always respond in the user's preferred language natively, warmly, and flawlessly (Armenian, Russian, or English).
2. STRICTLY FORBIDDEN: NEVER use generic, robotic template phrases like:
   - "Ի՞նչ եք առաջարկում քննարկել: Կարող ենք խոսել գիտության, արվեստի, տեխնոլոգիաների, գրքերի, կյանքի հետաքրքրությունների կամ որևէ այլ հետաքրքրաշարժ թեմայի մասին։ Լսում եմ ձեզ:"
   - Or any list of generic academic/cultural categories ("գիտություն, արվեստ, տեխնոլոգիաներ, գրքեր...").
   - "О чем вы хотите поговорить? Можем обсудить науку, искусство, технологии..."
   - "What would you like to discuss? We can talk about science, art, technology..."
3. When the user wants to chat, have a discussion, or asks what to talk about, BE A LIVELY, PROACTIVE, AND AUTHENTIC CONVERSATIONALIST:
   - Proactively suggest 2-3 specific, captivating, and intriguing dilemmas, thought experiments, curious questions, or exciting ideas (for example: futuristic technology, fascinating human psychology facts, mind-bending philosophical questions, travel stories, favorite hobbies, or fun dilemmas).
   - Talk naturally, casually, and engagingly like a clever and friendly companion.
4. STRICT TOPIC INDEPENDENCE & NO PREVIOUS BUSINESS CITES:
   - When the user asks a new question, changes the subject, asks for general advice, discusses a different topic, or asks about anything else, FOCUS 100% EXCLUSIVELY ON THEIR CURRENT TOPIC.
   - ABSOLUTELY NEVER mention, cite, compare, recommend, or bring up any previously discussed restaurant, business, set, or venue from earlier messages unless the user specifically and explicitly mentions that venue by name in their current prompt!
5. When the user asks about or mentions a specific business/restaurant by name, FOCUS 100% AND EXCLUSIVELY on that requested business. DO NOT mention, compare, reference, or bring up any previously discussed restaurants or businesses from prior conversation.
6. When the user specifically asks for restaurant/venue recommendations, menus, special packages/offers, hall/interior photos, or table reservations, provide clear, organized, and helpful venue details.
7. When asked for photos, hall photos, interior photos, or pictures of a venue, enthusiastically introduce the photos which are displayed in the attached interactive photo gallery card. NEVER say that you are a text-only assistant or that you cannot send/show photos/videos.
8. Keep the tone natural, genuine, witty, supportive, and welcoming.`;

async function callGemini(messages: any[]): Promise<string> {
  let lastError: any = null;
  for (const model of CANDIDATE_MODELS) {
    try {
      const res = await openai.chat.completions.create({
        model,
        messages,
      });
      const text = res.choices[0]?.message?.content;
      if (text) return text;
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${model} failed (${err?.status || err?.message}), trying next...`);
    }
  }
  throw lastError || new Error("All models failed");
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message } = body;
    const sessionId = body.sessionId || `session-${Date.now()}`;
    const userId = body.userId;

    if (!message?.trim() && !body.imageUrl) {
      return NextResponse.json({ error: "Message or image is required" }, { status: 400 });
    }

    const requestLang = body.lang || detectLanguage(message || "");
    const sessions = getSessions();
    let session = sessions.get(sessionId) || { step: null, lang: requestLang, messages: [] };

    if (!session.lang || body.lang) {
      session.lang = requestLang;
    }
    const lang = session.lang || 'hy';
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

    const lower = (message || "").toLowerCase().trim();
    const cleanLower = lower.replace(/[՞՝։,!\?]/g, '');
    const translitLower = transliterateHyToEn(lower);

    // --- FETCH ALL BUSINESSES ---
    let allBusinesses: any[] = [];
    try {
      const bizRes = await axios.get(`${apiUrl}/businesses?limit=50`, { timeout: 8000 });
      const rawBiz = bizRes.data?.data;
      allBusinesses = Array.isArray(rawBiz) ? rawBiz : (rawBiz?.businesses || []);
    } catch (e) {
      console.error("Failed to prefetch businesses:", e);
    }

    // Merge all sources to search businesses
    const combinedBizList = [...allBusinesses];
    for (const mb of MOCK_BUSINESSES) {
      if (!combinedBizList.some((b: any) => (b._id && b._id === mb.id) || (b.id && b.id === mb.id) || (b.slug && b.slug === mb.slug))) {
        combinedBizList.push(mb);
      }
    }

    const getBizCoverImage = (b: any) => {
      if (!b) return "";
      const metaCover = Array.isArray(b.metadata?.coverUrl) ? b.metadata.coverUrl[0] : b.metadata?.coverUrl;
      if (metaCover && typeof metaCover === 'string' && metaCover.trim().length > 0) return metaCover.trim();
      
      if (b.logo && typeof b.logo === 'string' && b.logo.trim().length > 0) return b.logo.trim();
      if (b.logoUrl && typeof b.logoUrl === 'string' && b.logoUrl.trim().length > 0) return b.logoUrl.trim();
      if (b.coverImageUrl && typeof b.coverImageUrl === 'string' && b.coverImageUrl.trim().length > 0) return b.coverImageUrl.trim();
      if (b.coverUrl && typeof b.coverUrl === 'string' && b.coverUrl.trim().length > 0) return b.coverUrl.trim();
      if (Array.isArray(b.highlights) && b.highlights[0]?.imageUrl) return b.highlights[0].imageUrl;
      if (Array.isArray(b.images) && b.images.length > 0 && typeof b.images[0] === 'string' && b.images[0].trim().length > 0) return b.images[0].trim();
      if (b.coverImage && typeof b.coverImage === 'string' && b.coverImage.trim().length > 0) return b.coverImage.trim();
      return "";
    };

    const getBizAllPhotos = (b: any): string[] => {
      if (!b) return [];
      const photos: string[] = [];
      const addPhoto = (url: any) => {
        if (typeof url === 'string' && url.trim().length > 0 && !photos.includes(url.trim())) {
          photos.push(url.trim());
        }
      };

      if (b.metadata?.coverUrl) {
        if (Array.isArray(b.metadata.coverUrl)) b.metadata.coverUrl.forEach(addPhoto);
        else addPhoto(b.metadata.coverUrl);
      }
      if (Array.isArray(b.metadata?.gallery)) b.metadata.gallery.forEach(addPhoto);
      if (Array.isArray(b.gallery)) b.gallery.forEach(addPhoto);
      if (Array.isArray(b.highlights)) {
        b.highlights.forEach((h: any) => addPhoto(typeof h === 'string' ? h : h?.imageUrl));
      }
      if (Array.isArray(b.images)) {
        b.images.forEach(addPhoto);
      }
      if (b.coverImageUrl) addPhoto(b.coverImageUrl);
      if (b.coverUrl) addPhoto(b.coverUrl);
      if (b.coverImage) addPhoto(b.coverImage);
      if (b.image) addPhoto(b.image);
      if (b.logo) addPhoto(b.logo);
      if (b.logoUrl) addPhoto(b.logoUrl);

      return photos;
    };

    // Helper to find business by ID or Name
    const findBusiness = async (idOrName: string) => {
      let biz = allBusinesses.find(b => b._id === idOrName || b.id === idOrName || (b.name && b.name.toLowerCase() === idOrName.toLowerCase()) || (b.slug && b.slug.toLowerCase() === idOrName.toLowerCase()));
      if (!biz) {
        biz = MOCK_BUSINESSES.find((b: any) => b.id === idOrName || b._id === idOrName || b.slug === idOrName || (b.name && b.name.toLowerCase() === idOrName.toLowerCase()));
      }
      if (!biz && idOrName.match(/^[0-9a-fA-F]{24}$/)) {
        try {
          const singleRes = await axios.get(`${apiUrl}/businesses/${idOrName}`, { timeout: 5000 });
          biz = singleRes.data?.data;
        } catch (_) {
          try {
            const offerRes = await axios.get(`${apiUrl}/offers/${idOrName}`, { timeout: 5000 });
            const offer = offerRes.data?.data;
            if (offer && offer.business) {
              const bId = typeof offer.business === 'object' ? offer.business._id : offer.business;
              biz = allBusinesses.find(b => b._id === bId);
              if (!biz) {
                const bRes = await axios.get(`${apiUrl}/businesses/${bId}`, { timeout: 5000 });
                biz = bRes.data?.data;
              }
              if (biz) {
                session.selectedOfferName = offer.packageName;
              }
            }
          } catch (__) {}
        }
      }
      return biz;
    };

    // --- 0. PHOTOS / GALLERY COMMAND (photos biz:... or gallery biz:...) ---
    if (lower.startsWith("photos biz:") || lower.startsWith("photos id:") || lower.startsWith("gallery biz:") || lower.startsWith("gallery id:")) {
      const rawParam = lower.replace("photos biz:", "").replace("photos id:", "").replace("gallery biz:", "").replace("gallery id:", "").trim();
      const biz = await findBusiness(rawParam);
      if (biz) {
        const allPhotos = getBizAllPhotos(biz);
        const photoCount = allPhotos.length;
        const prompts = {
          hy: photoCount > 0 
            ? `Ահա **«${biz.name}»**-ի «Ինտերիեր և Լուսանկարներ» բաժնի հրապարակված լուսանկարները (${photoCount} հատ) 👇` 
            : `Ահա **«${biz.name}»**-ի սրահի լուսանկարները 👇`,
          ru: photoCount > 0 
            ? `Вот опубликованные фотографии зала из раздела «Интерьер и Фотографии» **«${biz.name}»** (${photoCount} фото) 👇` 
            : `Вот фотографии зала **«${biz.name}»** 👇`,
          en: photoCount > 0 
            ? `Here are the published hall photos from the «Interior & Photos» section of **«${biz.name}»** (${photoCount} photos) 👇` 
            : `Here are the hall photos of **«${biz.name}»** 👇`
        };

        return NextResponse.json({
          response: prompts[lang],
          intent: "show_gallery",
          suggestions: [{
            id: biz._id,
            name: biz.name,
            category: biz.category?.name || "HoReCa",
            rating: biz.rating || 5,
            city: biz.city || biz.address || "Yerevan",
            shortDescription: biz.shortDescription || biz.description || "",
            slug: biz.slug || "biz",
            plan: biz.plan || "standard",
            latitude: biz.coordinates?.latitude || 40.1792,
            longitude: biz.coordinates?.longitude || 44.4991,
            coverImage: getBizCoverImage(biz),
            logo: biz.logo || biz.logoUrl || getBizCoverImage(biz),
            images: allPhotos,
            photos: allPhotos,
            gallery: allPhotos,
            highlights: biz.highlights || []
          }],
          quickReplies: [
            lang === 'hy' ? "🍽️ Դիտել մենյուն" : lang === 'ru' ? "🍽️ Меню" : "🍽️ View Menu",
            lang === 'hy' ? "📅 Ամրագրել սեղան" : lang === 'ru' ? "📅 Забронировать" : "📅 Book Table",
            lang === 'hy' ? "📍 Տեղադրություն" : lang === 'ru' ? "📍 Локация" : "📍 Location"
          ],
          sessionId
        });
      }
    }

    // --- 1. START BOOKING FLOW (book id:...) ---
    if (lower.startsWith("book id:") || lower.startsWith("book biz:")) {
      if (body.isBusinessUser || body.userRole === "business" || body.userRole === "owner") {
        return NextResponse.json({
          response: lang === 'hy'
            ? "⚠️ **Ուշադրություն.** Բիզնես (Business) հաշիվներով ամրագրում կատարել հնարավոր չէ:\n\nԱմրագրումներ կատարելու համար խնդրում ենք մուտք գործել կամ օգտագործել **անձնական (Personal)** հաշիվ:"
            : "⚠️ Business accounts cannot make reservations. Please log in with a personal account.",
          intent: "show_business_warning",
          suggestions: [],
          quickReplies: [],
          sessionId
        });
      }

      if (body.isGuest || (!body.userId && !body.user)) {
        return NextResponse.json({
          response: lang === 'hy'
            ? "🔒 **Ամրագրում կատարելու համար խնդրում ենք գրանցվել կամ մուտք գործել անձնական հաշիվ։**\n\n✨ **Ինչո՞ւ է գրանցումը շահեկան Ձեզ համար.**\n\n🎁 **1. Բոնուսներ և CashBack** — Յուրաքանչյուր ամրագրման դիմաց կուտակեք միավորներ և ստացեք բացառիկ զեղչեր ու նվերներ:\n\n🎫 **2. Անհատականեցված QR Կոդ** — Գրանցվելուց հետո Ձեր բոլոր ամրագրումները կունենան տվյալ բիզնեսին պատկանող անհատական QR կոդ, որը կպահպանվի Ձեր պրոֆիլում և կապահովի երաշխավորված սպասարկում:\n\n⚡ **3. Ակնթարթային ամրագրումներ** — Կարիք չի լինի ամեն անգամ լրացնել Ձեր կոնտակտային տվյալները:\n\n📱 **4. Պատմության և կարգավիճակի վերահսկում** — Դիտեք Ձեր ամրագրումների ընթացքն ու կարգավիճակը Ձեր անձնական էջում ցանկացած պահի:\n\n*Խնդրում ենք գրանցվել կամ մուտք գործել՝ ամրագրումը շարունակելու համար:*"
            : "🔒 Please log in or register to make a reservation and get personal QR codes and bonuses.",
          intent: "show_auth_prompt",
          suggestions: [],
          quickReplies: [],
          sessionId
        });
      }

      const rawParam = lower.replace("book id:", "").replace("book biz:", "").trim();
      const biz = await findBusiness(rawParam);

      if (biz) {
        session.selectedBizId = biz._id;
        session.selectedBizName = biz.name;

        // Fetch latest locations for this business
        let locations = biz.locations || [];
        if (locations.length === 0) {
          try {
            const locRes = await axios.get(`${apiUrl}/businesses/${biz._id}/locations`, { timeout: 5000 });
            locations = locRes.data?.data || [];
          } catch (_) {}
        }

        // Check if multiple branches exist
        if (locations.length > 1) {
          session.step = 'booking_location';
          sessions.set(sessionId, session);

          const locSuggestions = locations.map((loc: any) => ({
            id: loc._id,
            name: loc.name || biz.name,
            category: "Location",
            rating: biz.rating || 5,
            city: loc.city || "Yerevan",
            address: loc.address,
            phone: loc.phone || biz.phone || "",
            shortDescription: `${loc.address || ''}${loc.city ? ` (${loc.city})` : ''}`,
            slug: biz.slug || "biz",
            plan: biz.plan || "standard",
            latitude: loc.coordinates?.latitude || biz.coordinates?.latitude || 40.1792,
            longitude: loc.coordinates?.longitude || biz.coordinates?.longitude || 44.4991,
          }));

          const prompts = {
            hy: `«**${biz.name}**» հաստատությունն ունի **${locations.length}** մասնաճյուղ:\n\nԽնդրում ենք ընտրել, թե որ հասցեում եք ցանկանում ամրագրել սեղան 👇`,
            ru: `У «**${biz.name}**» есть **${locations.length}** филиала(ов).\n\nПожалуйста, выберите подходящий филиал для бронирования 👇`,
            en: `«**${biz.name}**» has **${locations.length}** branch locations.\n\nPlease select which branch address you would like to book 👇`
          };

          return NextResponse.json({
            response: prompts[lang],
            intent: "show_location_picker",
            suggestions: locSuggestions,
            quickReplies: [],
            sessionId
          });
        } else {
          // Single branch or default address -> transition to CUISINE selection!
          const singleLoc = locations[0];
          session.selectedLocationId = singleLoc?._id;
          session.selectedLocationAddress = singleLoc ? `${singleLoc.address || ''}${singleLoc.city ? ` (${singleLoc.city})` : ''}` : `${biz.address || ''}${biz.city ? ` (${biz.city})` : ''}`;
          session.selectedLocationName = singleLoc?.name || biz.name;

          let bizOffers: any[] = [];
          try {
            const offRes = await axios.get(`${apiUrl}/offers/ai-search?businessId=${biz._id}`, { timeout: 5000 });
            bizOffers = offRes.data?.data || [];
          } catch (_) {}

          const availCuisines = getBusinessCuisines(biz, bizOffers);
          session.availableCuisines = availCuisines;
          session.step = 'booking_cuisine';
          sessions.set(sessionId, session);

          const quickReplies = availCuisines.map(cKey => {
            const meta = CUISINE_DICTIONARY[cKey];
            const label = meta ? (lang === 'ru' ? meta.ru : lang === 'en' ? meta.en : meta.hy) : cKey;
            const emoji = CUISINE_EMOJIS[cKey] || "🍽️";
            return `${emoji} ${label}`;
          });

          const prompts = {
            hy: `Ընտրված է՝ «**${biz.name}**» (${session.selectedLocationAddress}) 📍\n\nԻ՞նչ խոհանոց եք նախընտրում այս հաստատությունում 👇`,
            ru: `Выбрано: «**${biz.name}**» (${session.selectedLocationAddress}) 📍\n\nКакую кухню вы предпочитаете в этом заведении? 👇`,
            en: `Selected: «**${biz.name}**» (${session.selectedLocationAddress}) 📍\n\nWhich cuisine do you prefer at this venue? 👇`
          };

          return NextResponse.json({
            response: prompts[lang],
            intent: "ask_cuisine",
            suggestions: [],
            quickReplies,
            sessionId
          });
        }
      }
    }

    // --- 2. SELECT BRANCH LOCATION (select_location...) ---
    if (lower.startsWith("select_location") || (session.step === 'booking_location' && !detectCuisine(message))) {
      let locId = "";
      let locAddress = "";
      let locName = "";

      if (lower.startsWith("select_location")) {
        const idMatch = message.match(/id:([^\s]+)/);
        const addrMatch = message.match(/address:([^\s]+)/);
        const cityMatch = message.match(/city:([^\s]+)/);
        const nameMatch = message.match(/name:([^\s]+)/);

        if (idMatch) locId = idMatch[1];
        if (addrMatch) {
          try {
            locAddress = decodeURIComponent(addrMatch[1]);
          } catch (_) {
            locAddress = addrMatch[1];
          }
        }
        if (cityMatch) {
          try {
            const c = decodeURIComponent(cityMatch[1]);
            if (c && !locAddress.includes(c)) locAddress += ` (${c})`;
          } catch (_) {}
        }
        if (nameMatch) {
          try {
            locName = decodeURIComponent(nameMatch[1]);
          } catch (_) {}
        }
      } else if (session.selectedBizId) {
        // Matched by user typing location name/address/ordinal
        try {
          const locRes = await axios.get(`${apiUrl}/businesses/${session.selectedBizId}/locations`, { timeout: 5000 });
          const locations = locRes.data?.data || [];
          
          let found: any = null;
          if (cleanLower === "1" || cleanLower.includes("առաջին") || cleanLower.includes("1-ին") || cleanLower.includes("first")) {
            found = locations[0];
          } else if (cleanLower === "2" || cleanLower.includes("երկրորդ") || cleanLower.includes("2-րդ") || cleanLower.includes("second")) {
            found = locations[1];
          } else if (cleanLower === "3" || cleanLower.includes("երրորդ") || cleanLower.includes("3-րդ") || cleanLower.includes("third")) {
            found = locations[2];
          } else if (cleanLower === "4" || cleanLower.includes("չորրորդ") || cleanLower.includes("4-րդ") || cleanLower.includes("fourth")) {
            found = locations[3];
          }

          if (!found) {
            found = locations.find((l: any) => {
              const lCity = (l.city || "").toLowerCase();
              const lAddr = (l.address || "").toLowerCase();
              const lName = (l.name || "").toLowerCase();
              const lTranslit = transliterateHyToEn(`${lCity} ${lAddr} ${lName}`);

              return cleanLower.includes(lCity) || cleanLower.includes(lAddr) || cleanLower.includes(lName) ||
                translitLower.includes(transliterateHyToEn(lCity)) || translitLower.includes(transliterateHyToEn(lAddr)) ||
                lTranslit.includes(translitLower);
            });
          }

          if (found) {
            locId = found._id;
            locAddress = `${found.address || ''}${found.city ? ` (${found.city})` : ''}`;
            locName = found.name || "";
          } else {
            locAddress = message;
          }
        } catch (_) {
          locAddress = message;
        }
      }

      session.selectedLocationId = locId;
      session.selectedLocationAddress = locAddress || session.selectedLocationAddress || "Գլխավոր մասնաճյուղ";
      session.selectedLocationName = locName || session.selectedBizName;

      // Determine available cuisines for this venue
      let biz = allBusinesses.find(b => b._id === session.selectedBizId);
      let bizOffers: any[] = [];
      try {
        const offRes = await axios.get(`${apiUrl}/offers/ai-search?businessId=${session.selectedBizId}`, { timeout: 5000 });
        bizOffers = offRes.data?.data || [];
      } catch (_) {}

      const availCuisines = getBusinessCuisines(biz, bizOffers);
      session.availableCuisines = availCuisines;
      session.step = 'booking_cuisine';
      sessions.set(sessionId, session);

      const quickReplies = availCuisines.map(cKey => {
        const meta = CUISINE_DICTIONARY[cKey];
        const label = meta ? (lang === 'ru' ? meta.ru : lang === 'en' ? meta.en : meta.hy) : cKey;
        const emoji = CUISINE_EMOJIS[cKey] || "🍽️";
        return `${emoji} ${label}`;
      });

      const prompts = {
        hy: `Ընտրված է մասնաճյուղը՝ **${session.selectedLocationAddress}** 📍\n\nԻ՞նչ խոհանոց եք նախընտրում այս հաստատությունում 👇`,
        ru: `Выбран филиал: **${session.selectedLocationAddress}** 📍\n\nКакую кухню вы предпочитаете в этом заведении? 👇`,
        en: `Selected branch: **${session.selectedLocationAddress}** 📍\n\nWhich cuisine do you prefer at this venue? 👇`
      };

      return NextResponse.json({
        response: prompts[lang],
        intent: "ask_cuisine",
        suggestions: [],
        quickReplies,
        sessionId
      });
    }

    // --- 3. SELECT CUISINE (booking_cuisine) ---
    if (session.step === 'booking_cuisine') {
      const availCuisines = session.availableCuisines || ['armenian', 'caucasian', 'grill'];
      const detected = detectCuisine(message);

      // Case A: Cuisine detected but NOT in available cuisines for this venue
      if (detected && !availCuisines.includes(detected.key)) {
        const availableListText = availCuisines.map(k => {
          const meta = CUISINE_DICTIONARY[k];
          const label = meta ? (lang === 'ru' ? meta.ru : lang === 'en' ? meta.en : meta.hy) : k;
          const emoji = CUISINE_EMOJIS[k] || "🍽️";
          return `• ${emoji} **${label}**`;
        }).join('\n');

        const quickReplies = availCuisines.map(k => {
          const meta = CUISINE_DICTIONARY[k];
          const label = meta ? (lang === 'ru' ? meta.ru : lang === 'en' ? meta.en : meta.hy) : k;
          const emoji = CUISINE_EMOJIS[k] || "🍽️";
          return `${emoji} ${label}`;
        });

        const prompts = {
          hy: `Ցավոք, «**${session.selectedBizName}**»-ում **${detected.label}** խոհանոց առկա չէ ❌\n\nԱյս հաստատությունում առկա են հետևյալ խոհանոցները՝\n${availableListText}\n\nԽնդրում ենք ընտրել առկա տարբերակներից 👇`,
          ru: `К сожалению, в «**${session.selectedBizName}**» нет кухни **${detected.label}** ❌\n\nВ этом заведении доступны следующие кухни:\n${availableListText}\n\nПожалуйста, выберите из доступных вариантов 👇`,
          en: `Unfortunately, «**${session.selectedBizName}**» does not offer **${detected.label}** cuisine ❌\n\nThe following cuisines are available at this venue:\n${availableListText}\n\nPlease choose from the available options 👇`
        };

        return NextResponse.json({
          response: prompts[lang],
          intent: "ask_cuisine",
          suggestions: [],
          quickReplies,
          sessionId
        });
      }

      // Case B: Cuisine is valid and available (or user selected one)
      const chosenCuisineKey = detected ? detected.key : availCuisines[0];
      const chosenCuisineLabel = detected ? detected.label : (CUISINE_DICTIONARY[chosenCuisineKey]?.hy || chosenCuisineKey);

      session.selectedCuisine = chosenCuisineLabel;
      session.step = 'booking_datetime';
      sessions.set(sessionId, session);

      // Fetch offers under this cuisine for this business
      let bizOffers: any[] = [];
      try {
        const offRes = await axios.get(`${apiUrl}/offers/ai-search?businessId=${session.selectedBizId}`, { timeout: 5000 });
        bizOffers = offRes.data?.data || [];
      } catch (_) {}

      // If offers exist for this business, present them
      if (bizOffers.length > 0) {
        const offerSuggestions = bizOffers.map((o: any) => ({
          id: o._id,
          name: session.selectedBizName || "Restaurant",
          category: chosenCuisineLabel,
          rating: 5,
          city: session.selectedLocationAddress || "Yerevan",
          shortDescription: o.packageName,
          slug: "biz",
          plan: "standard",
          packageName: o.packageName,
          price: o.price,
          pax: o.pax,
          atmosphere: o.atmosphere,
          location: session.selectedLocationAddress,
          cuisine: o.cuisine || chosenCuisineLabel,
          dishesHy: Array.isArray(o.dishes) ? o.dishes.join(", ") : o.dishes,
          dishesEn: Array.isArray(o.dishesEn) ? o.dishesEn.join(", ") : o.dishesEn,
          dishesRu: Array.isArray(o.dishesRu) ? o.dishesRu.join(", ") : o.dishesRu,
        }));

        const prompts = {
          hy: `Հիանալի է: Ահա «**${session.selectedBizName}**»-ի բոլոր առաջարկներն ու սեթերը **${chosenCuisineLabel}** խոհանոցի համար 👇\n\nԿարող եք ընտրել սեթերից որևէ մեկը կամ նշել ամրագրման օրն ու ժամը։`,
          ru: `Отлично! Вот все предложения и сеты заведения «**${session.selectedBizName}**» для кухни **${chosenCuisineLabel}** 👇\n\nВы можете выбрать сет или указать дату и время бронирования.`,
          en: `Great! Here are all offers and sets for «**${session.selectedBizName}**» under **${chosenCuisineLabel}** cuisine 👇\n\nYou can select a set or specify your booking date & time.`
        };

        return NextResponse.json({
          response: prompts[lang],
          intent: "show_results",
          suggestions: offerSuggestions,
          quickReplies: ["📅 Ընտրել օրն ու ժամը"],
          sessionId
        });
      } else {
        const prompts = {
          hy: `Հիանալի է, ընտրված է **${chosenCuisineLabel}** խոհանոցը 🍽️\n\nՈ՞ր օրվա և ժամի համար եք ցանկանում ամրագրել (օրինակ՝ այսօր 20:00)։`,
          ru: `Отлично, выбрана **${chosenCuisineLabel}** кухня 🍽️\n\nНа какую дату и время хотите забронировать (например, сегодня в 20:00)?`,
          en: `Great, selected **${chosenCuisineLabel}** cuisine 🍽️\n\nWhat date and time would you like to book (e.g. today at 20:00)?`
        };

        return NextResponse.json({
          response: prompts[lang],
          intent: "show_datetime_picker",
          suggestions: [],
          quickReplies: [],
          sessionId
        });
      }
    }

    // --- 4. SELECT DATE & TIME (booking_datetime) ---
    if (session.step === 'booking_datetime') {
      const isOtherBizQuery = lower.includes("այլ ռեստորան") || 
        lower.includes("այլ վայր") || 
        lower.includes("ուրիշ ռեստորան") || 
        lower.includes("ուրիշ վայր") || 
        lower.includes("ուրիշ տեղ") || 
        lower.includes("առաջարկել այլ") || 
        lower.includes("առաջարկիր այլ") || 
        lower.includes("другие рестораны") || 
        lower.includes("другое заведение") || 
        lower.includes("other restaurant") || 
        lower.includes("other venue");

      if (isOtherBizQuery) {
        const currentBizId = session.selectedBizId;
        session.selectedBizId = undefined;
        session.selectedBizName = undefined;
        session.step = null;

        // Find restaurants other than the current one
        const otherBizs = combinedBizList.filter((b: any) => {
          const bId = b._id || b.id;
          return bId !== currentBizId && (b.category?.slug === 'restaurant' || b.category?.name === 'Restaurant' || b.category?.name === 'Ռեստորան' || (Array.isArray(b.menu) && b.menu.length > 0) || (Array.isArray(b.services) && b.services.length > 0));
        }).slice(0, 4);

        const listToSuggest = otherBizs.length > 0 ? otherBizs : combinedBizList.filter((b: any) => (b._id || b.id) !== currentBizId).slice(0, 4);

        const otherSuggestions = listToSuggest.map((b: any) => ({
          id: b._id || b.id,
          name: b.name,
          category: b.category?.name || "Restaurant",
          rating: b.rating || b.ratingAvg || 5,
          city: b.city || b.address || "Yerevan",
          shortDescription: b.shortDescription || b.description || "Հիանալի վայր հանգստի և ընթրիքի համար",
          slug: b.slug || "biz",
          plan: b.plan || "standard",
          latitude: b.coordinates?.latitude || b.lat || 40.1792,
          longitude: b.coordinates?.longitude || b.lng || 44.4991,
          coverImage: getBizCoverImage(b),
          logo: b.logo || b.logoUrl || getBizCoverImage(b),
          images: b.images || [],
          image: getBizCoverImage(b)
        }));

        const prompts = {
          hy: `Ահա առաջարկվող այլ հիանալի ռեստորանները 👇\n\nԿարող եք ընտրել դրանցից որևէ մեկը՝ մանրամասները դիտելու կամ սեղան ամրագրելու համար։`,
          ru: `Вот другие отличные рекомендуемые рестораны 👇\n\nВы можете выбрать любой из них, чтобы посмотреть подробности или забронировать столик.`,
          en: `Here are other great recommended restaurants 👇\n\nYou can select any of them to view details or book a table.`
        };

        return NextResponse.json({
          response: prompts[lang],
          intent: "select_business",
          suggestions: otherSuggestions,
          quickReplies: [],
          sessionId
        });
      }

      if (lower.includes("ընտրել օր") || lower.includes("ընտրել ժամ") || lower.includes("ընտրել այլ ժամ") || lower.includes("выбрать дату") || lower.includes("другое время") || lower.includes("choose date") || lower.includes("another time")) {
        const prompts = {
          hy: "Խնդրում ենք նշել կամ ընտրել ամրագրման նոր օրն ու ժամը 👇",
          ru: "Пожалуйста, укажите или выберите новую дату и время бронирования 👇",
          en: "Please specify or select a new booking date and time 👇"
        };
        return NextResponse.json({
          response: prompts[lang],
          intent: "show_datetime_picker",
          suggestions: [],
          quickReplies: [],
          sessionId
        });
      }

      // Find the active business to check working hours
      const activeBiz = combinedBizList.find((b: any) => (b._id && b._id === session.selectedBizId) || (b.id && b.id === session.selectedBizId)) || combinedBizList.find((b: any) => b.name && session.selectedBizName && b.name.toLowerCase() === session.selectedBizName.toLowerCase());
      const bizName = session.selectedBizName || activeBiz?.name || "Հաստատություն";

      const scheduleCheck = checkBusinessSchedule(activeBiz, message);

      // --- 1. IF CLOSED AT THAT HOUR ---
      if (!scheduleCheck.isOpen) {
        const prompts = {
          hy: `❌ **«${bizName}»-ը Ձեր նշած ժամին (${scheduleCheck.requestedTimeStr}) փակ է։**\n\n🕒 **Աշխատանքային ժամերն են՝** **${scheduleCheck.openTime} - ${scheduleCheck.closeTime}**${scheduleCheck.dayName ? ` (${scheduleCheck.dayName})` : ''}:\n\nՑանկանո՞ւմ եք ընտրել այլ աշխատանքային ժամ, թե՞ առաջարկեմ տվյալ ժամին բաց այլ ռեստորաններ։`,
          ru: `❌ **Заведение «${bizName}» в указанное время (${scheduleCheck.requestedTimeStr}) закрыто.**\n\n🕒 **Часы работы:** **${scheduleCheck.openTime} - ${scheduleCheck.closeTime}**${scheduleCheck.dayName ? ` (${scheduleCheck.dayName})` : ''}.\n\nХотите выбрать другое рабочее время или предложить другие открытые рестораны на это время?`,
          en: `❌ **«${bizName}» is closed at your selected time (${scheduleCheck.requestedTimeStr}).**\n\n🕒 **Working hours:** **${scheduleCheck.openTime} - ${scheduleCheck.closeTime}**${scheduleCheck.dayName ? ` (${scheduleCheck.dayName})` : ''}.\n\nWould you like to choose another time or should I suggest other restaurants that are open at this time?`
        };

        const closedQuickReplies = [
          lang === 'hy' ? "📅 Ընտրել այլ ժամ" : lang === 'ru' ? "📅 Выбрать другое время" : "📅 Choose another time",
          lang === 'hy' ? "🍽️ Առաջարկել այլ ռեստորաններ" : lang === 'ru' ? "🍽️ Другие рестораны" : "🍽️ Suggest other restaurants"
        ];

        return NextResponse.json({
          response: prompts[lang],
          intent: "ask_datetime",
          suggestions: [],
          quickReplies: closedQuickReplies,
          sessionId
        });
      }

      // --- 2. IF OPEN, BUT CLOSING SOON (within 2 to 3 hours) ---
      session.bookingDateTime = message;
      session.step = 'booking_details';
      sessions.set(sessionId, session);

      if (scheduleCheck.isClosingSoon) {
        const prompts = {
          hy: `ℹ️ **Ուշադրություն.** «**${bizName}**»-ը նշված ժամին բաց է, սակայն հաշվի առեք, որ հաստատությունը փակվում է **${scheduleCheck.closeTime}**-ին (ամրագրված ժամից մնում է **${scheduleCheck.hoursLeft} ժամ**):\n\nԽնդրում եմ նշել Ձեր անունը, հեռախոսահամարը և անձանց քանակը՝ ամրագրումը շարունակելու համար (օրինակ՝ Արամ, +37499123456, 4 անձ)։`,
          ru: `ℹ️ **Внимание:** Заведение «**${bizName}**» открыто, однако обратите внимание, что оно закрывается в **${scheduleCheck.closeTime}** (до закрытия остается **${scheduleCheck.hoursLeft} ч.**):\n\nПожалуйста, укажите ваше имя, номер телефона и количество персон (например: Арам, +37499123456, 4 персоны):`,
          en: `ℹ️ **Please note:** «**${bizName}**» is open, but closes at **${scheduleCheck.closeTime}** (leaving **${scheduleCheck.hoursLeft} hours** from your booking time):\n\nPlease provide your name, phone number, and number of guests to continue (e.g. Aram, +37499123456, 4 guests):`
        };

        return NextResponse.json({
          response: prompts[lang],
          intent: "ask_booking_details",
          suggestions: [],
          quickReplies: [],
          sessionId
        });
      }

      // --- 3. IF OPEN NORMALLY (> 3 hours) ---
      const normalPrompts = {
        hy: "Խնդրում եմ նշել Ձեր անունը, հեռախոսահամարը և անձանց քանակը (օրինակ՝ Արամ, +37499123456, 4 անձ)։",
        ru: "Пожалуйста, укажите ваше имя, номер телефона и количество персон (например: Арам, +37499123456, 4 персоны):",
        en: "Please provide your name, phone number, and number of guests (e.g. Aram, +37499123456, 4 guests):"
      };

      return NextResponse.json({
        response: normalPrompts[lang],
        intent: "ask_booking_details",
        suggestions: [],
        quickReplies: [],
        sessionId
      });
    }

    // --- 5. ENTER DETAILS (booking_details) ---
    if (session.step === 'booking_details') {
      const details = message;
      session.bookingDetails = details;
      session.step = 'booking_confirm';
      sessions.set(sessionId, session);

      const summaryText = `🏢 Հաստատություն: ${session.selectedBizName || 'Ընտրված վայր'}\n📍 Մասնաճյուղ / Հասցե: ${session.selectedLocationAddress || 'Գլխավոր հասցե'}\n🍲 Խոհանոց: ${session.selectedCuisine || 'Հիմնական'}\n🗓️ Ամսաթիվ և Ժամ: ${session.bookingDateTime}\n👤 Մանրամասներ: ${details}`;

      const prompts = {
        hy: "Խնդրում եմ ստուգել ամրագրման մանրամասները և հաստատել 👇",
        ru: "Пожалуйста, проверьте детали бронирования и подтвердите 👇",
        en: "Please review the booking details and confirm 👇"
      };

      return NextResponse.json({
        response: prompts[lang],
        intent: "show_summary_card",
        suggestions: [{
          id: "summary",
          name: session.selectedBizName || "Treeo Booking",
          category: "Summary",
          rating: 5,
          city: session.selectedLocationAddress || "",
          shortDescription: summaryText,
          slug: "",
          plan: "starter"
        }],
        quickReplies: [],
        sessionId
      });
    }

    // --- 6. CONFIRM BOOKING (booking_confirm) ---
    if (session.step === 'booking_confirm') {
      if (lower === "confirm_booking" || lower.includes("հաստատել") || lower.includes("confirm") || lower.includes("подтвердить")) {
        let bookingCode = '#' + Math.floor(10000 + Math.random() * 90000);
        let createdBookingId = `bk-${Date.now()}`;
        let qrTokenClean = Math.random().toString(36).substr(2, 10).toUpperCase();

        try {
          if (session.selectedBizId && session.selectedBizId.match(/^[0-9a-fA-F]{24}$/)) {
            const rawDetails = session.bookingDetails || "";
            const phoneMatch = rawDetails.match(/(\+?374\d{8}|\d{9}|\d{8})/);
            const nameMatch = rawDetails.split(/[,;\n]/)[0]?.replace(phoneMatch ? phoneMatch[0] : "", "").trim();

            const bookingPayload = {
              businessId: session.selectedBizId,
              locationId: session.selectedLocationId || undefined,
              customerName: (body.userName && body.userName.trim().length > 1) ? body.userName : (nameMatch && nameMatch.length > 1 ? nameMatch : "Treeo Customer"),
              customerPhone: (body.userPhone && body.userPhone.trim().length > 4) ? body.userPhone : (phoneMatch ? phoneMatch[0] : "+37400000000"),
              date: session.bookingDateTime ? new Date(session.bookingDateTime.split('T')[0] || new Date()).toISOString() : new Date().toISOString(),
              timeSlot: session.bookingDateTime?.includes('T') ? session.bookingDateTime.split('T')[1]?.substring(0, 5) || "20:00" : "20:00",
              serviceName: session.selectedOfferName || session.selectedBizName || "Table Reservation",
              totalPrice: 0,
              notes: `Booked via Treeo AI | Branch: ${session.selectedLocationAddress || 'Default'} | Cuisine: ${session.selectedCuisine || 'General'} | Details: ${session.bookingDetails || ''}`
            };
            const bRes = await axios.post(`${apiUrl}/bookings`, bookingPayload);
            if (bRes.data.data?._id) {
              createdBookingId = bRes.data.data._id;
            }
            if (bRes.data.data?.qrToken) {
              qrTokenClean = bRes.data.data.qrToken;
              bookingCode = '#' + bRes.data.data.qrToken;
            }
          }
        } catch (err) {
          console.error("Error creating booking document:", err);
        }

        const bookedBizName = session.selectedBizName || "Հաստատություն";
        const bookedLoc = session.selectedLocationAddress || "Գլխավոր հասցե";
        const bookedDateTime = session.bookingDateTime || "";
        const bookedBizId = session.selectedBizId;
        session.step = null;
        sessions.delete(sessionId);

        const prompts = {
          hy: `✅ **Ձեր ամրագրման հայտը հաջողությամբ ներկայացվել է «${bookedBizName}» (${bookedLoc}) հաստատությանը։**\n\n📞 **Ձեզ հետ շուտով կկապնվեն հաստատության աշխատակիցները՝ ամրագրումը վերջնական հաստատելու համար։**\n\n🎫 **Կապ հաստատելուց և ամրագրումը հաստատելուց հետո Դուք կստանաք տվյալ բիզնեսին պատկանող անհատականեցված QR կոդ**, որը պետք է ներկայացնեք հաստատությունում՝ այցելությունը հաստատելու համար։\n\n📱 Ձեր անհատական QR կոդը և ամրագրման կարգավիճակը ավտոմատ կերպով հայտնվել են Ձեր **անձնական պրոֆիլի «Ամրագրումներ»** բաժնում, ինչպես նաև տվյալ բիզնեսի վահանակում։\n\nԱմրագրման հայտի կոդ՝ **${bookingCode}**`,
          ru: `✅ **Ваша заявка на бронирование успешно отправлена в заведение «${bookedBizName}» (${bookedLoc}).**\n\n📞 **В ближайшее время сотрудники заведения свяжутся с вами для окончательного подтверждения бронирования.**\n\n🎫 **После связи и подтверждения вы получите персонализированный QR-код данного заведения**, который необходимо будет предъявить на месте для подтверждения визита.\n\n📱 Ваш персональный QR-код и статус бронирования автоматически сохранены в разделе **«Бронирования» вашего личного профиля**, а также в панели заведения.\n\nКод бронирования: **${bookingCode}**`,
          en: `✅ **Your booking request has been successfully submitted to «${bookedBizName}» (${bookedLoc}).**\n\n📞 **The venue staff will contact you shortly to finalize and confirm your reservation.**\n\n🎫 **Once contacted and confirmed, you will receive a personalized QR code for this venue**, which you need to present upon arrival to validate your booking.\n\n📱 Your personalized QR code and booking status are automatically available in your **Profile's "Bookings"** section and in the venue's dashboard.\n\nBooking reference: **${bookingCode}**`
        };

        return NextResponse.json({
          response: prompts[lang],
          intent: "booking_success",
          suggestions: [{
            id: createdBookingId,
            businessId: bookedBizId,
            name: bookedBizName,
            category: "Booking",
            rating: 5,
            city: bookedLoc,
            shortDescription: `Հայտ՝ ${bookingCode} | Ժամ՝ ${bookedDateTime || '20:00'}`,
            slug: "",
            plan: "standard",
            qrToken: qrTokenClean,
            bookingCode: bookingCode,
            dateTime: bookedDateTime,
            status: "pending"
          }],
          quickReplies: [],
          sessionId
        });
      }
    }

    // --- TOPIC CHANGE & GENERAL DISCUSSION / ADVICE DETECTION ---
    const isTopicChangeOrDiscussion = /խորհուրդ|քննարկ|զրուց|զրույց|թեման փոխ|փոխենք թեման|կարծիք|պատմիր|ինչպես|ինչու|հարց|օգնիր|ինչ անել|հոգնած|հետաքրքիր|ֆիլմ|գիրք|երաժշտ|եղանակ|տարբերակ|ինչ ես կարծում|ի՞նչ ես կարծում|ինչ կասես|ի՞նչ կասես|դու ով ես|ինչ կարող ես|խոսենք|բացատրիր|advice|discuss|conversation|topic|opinion|tell me|how to|why|help me|tired|interesting|movie|book|music|weather|совет|обсуд|поговор|тема|мнение|расскажи|как|почему|помоги|устал|фильм|книга|музыка|погода/i.test(cleanLower);

    // --- ACCURATE TARGETED BUSINESS DETECTION ---
    const genericBusinessWords = new Set(["hotel", "restaurant", "cafe", "lounge", "grill", "ռեստորան", "սրճարան", "հյուրանոց", "mot", "մոտ", "and", "the", "materials", "food"]);
    let explicitlyMentionedBiz: any = null;

    const userWordTokens = new Set(cleanLower.split(/[\s,.:;!?"'()-]+/g).filter(Boolean));
    const translitWordTokens = new Set(translitLower.split(/[\s,.:;!?"'()-]+/g).filter(Boolean));

    for (const b of combinedBizList) {
      const bName = (b.name || "").toLowerCase().trim();
      const bSlug = (b.slug || "").toLowerCase().trim();
      const bNameTranslit = transliterateHyToEn(bName).toLowerCase().trim();

      if (bName.length < 3) continue;

      let isMatch = false;

      // 1. Direct full business name match in message
      if (cleanLower.includes(bName) || translitLower.includes(bName) || (bNameTranslit && cleanLower.includes(bNameTranslit)) || (bSlug.length >= 4 && (cleanLower.includes(bSlug) || translitLower.includes(bSlug)))) {
        isMatch = true;
      }

      // 2. Specific unique business keywords (>= 4 chars, excluding generic words)
      if (!isMatch) {
        const significantWords = bName.split(/\s+/).filter((w: string) => w.length >= 4 && !genericBusinessWords.has(w));
        if (significantWords.length > 0) {
          isMatch = significantWords.some((w: string) => userWordTokens.has(w) || translitWordTokens.has(w) || (w.length >= 5 && (cleanLower.includes(w) || translitLower.includes(w))));
        }
      }

      if (isMatch) {
        explicitlyMentionedBiz = b;
        break;
      }
    }

    // Explicit pronoun referral check (e.g. "սրա հասցեն", "դրա մենյուն", "սրա նկարները", "its menu")
    const isExplicitPronounReferral = /(սրա|դրա|նրա|տվյալ|այդ|այս)\s*(հասցե|նկար|մենյու|սրահ|ուտեստ|գին|գներ|առաջարկ|սեթ|տեղեկ|ժամ|օր|հեռախոս|ամրագր)/i.test(cleanLower) || 
      /(սրա|դրա|նրա)\s+(մասին|հետ|մոտ)/i.test(cleanLower) || 
      /(its|his|her|this|that)\s+(menu|photos|address|dishes|prices|location|hours|phone|booking)/i.test(cleanLower) || 
      /(его|ее|этого|этом)\s+(меню|фото|адрес|блюда|цены|локация|часы|телефон|бронь)/i.test(cleanLower);

    let targetedBiz: any = explicitlyMentionedBiz;
    const isExplicitNewBusinessTargeted = !!explicitlyMentionedBiz;

    if (isExplicitNewBusinessTargeted && explicitlyMentionedBiz) {
      session.selectedBizId = explicitlyMentionedBiz._id || explicitlyMentionedBiz.id;
      session.selectedBizName = explicitlyMentionedBiz.name;
      session.step = null;
    } else if (isExplicitPronounReferral && session.selectedBizId) {
      targetedBiz = combinedBizList.find(b => (b._id && b._id === session.selectedBizId) || (b.id && b.id === session.selectedBizId));
    } else {
      // User is asking something else or changing topic: completely reset previous business context
      targetedBiz = null;
      session.selectedBizId = undefined;
      session.selectedBizName = undefined;
      session.step = null;
    }

    // --- INTENT CLASSIFICATION ---
    const isPhotoQuery = !isTopicChangeOrDiscussion && /նկար|լուսանկար|սրահ|ինտերիեր|տեսք|գալերե|ֆոտո|photo|picture|gallery|interior|фото|зал|галере/i.test(cleanLower);
    const isLocationQuery = !isTopicChangeOrDiscussion && /հասցե|մասնաճյուղ|որտեղ|տեղակայ|գտնվ|տեղը|address|branch|filial|where|location|адрес|филиал|где/i.test(cleanLower);
    const isBookingIntent = !isTopicChangeOrDiscussion && /ամրագր|բուք|պատվիր|book|reserv|забронир|бронь/i.test(cleanLower);
    const isExplicitOfferQuery = !isTopicChangeOrDiscussion && /առաջարկ|սեթ|փաթեթ|offer|package|set|предложени|\d+\s*(անձ|հոգ|մարդ|person|people|pax|человек)|\d+\s*(դրամ|amd|֏|rub|usd|\$|հազար)|բյուջե|գումար/i.test(cleanLower);
    const isMenuQuery = !isTopicChangeOrDiscussion && /մենյու|ճաշացանկ|ուտեստ|menu|меню|блюд/i.test(cleanLower);

    // --- PHOTO / HALL / INTERIOR QUERY INTERCEPTION ---
    if (isPhotoQuery && !isTopicChangeOrDiscussion) {
      const activeBiz = targetedBiz;
      if (activeBiz) {
        const allPhotos = getBizAllPhotos(activeBiz);
        const photoCount = allPhotos.length;
        const prompts = {
          hy: photoCount > 0 
            ? `Ահա **«${activeBiz.name}»**-ի «Ինտերիեր և Լուսանկարներ» բաժնի հրապարակված լուսանկարները (${photoCount} հատ) 👇` 
            : `Ահա **«${activeBiz.name}»**-ի սրահի լուսանկարները 👇`,
          ru: photoCount > 0 
            ? `Вот опубликованные фотографии зала из раздела «Интерьер и Фотографии» **«${activeBiz.name}»** (${photoCount} фото) 👇` 
            : `Вот фотографии зала **«${activeBiz.name}»** 👇`,
          en: photoCount > 0 
            ? `Here are the published hall photos from the «Interior & Photos» section of **«${activeBiz.name}»** (${photoCount} photos) 👇` 
            : `Here are the hall photos of **«${activeBiz.name}»** 👇`
        };

        session.selectedBizId = activeBiz._id;
        session.selectedBizName = activeBiz.name;
        session.messages.push({ role: "user", content: message });
        session.messages.push({ role: "assistant", content: prompts[lang] });
        sessions.set(sessionId, session);

        return NextResponse.json({
          response: prompts[lang],
          intent: "show_gallery",
          suggestions: [{
            id: activeBiz._id,
            name: activeBiz.name,
            category: activeBiz.category?.name || "HoReCa",
            rating: activeBiz.rating || 5,
            city: activeBiz.city || activeBiz.address || "Yerevan",
            shortDescription: activeBiz.shortDescription || activeBiz.description || "",
            slug: activeBiz.slug || "biz",
            plan: activeBiz.plan || "standard",
            latitude: activeBiz.coordinates?.latitude || 40.1792,
            longitude: activeBiz.coordinates?.longitude || 44.4991,
            coverImage: getBizCoverImage(activeBiz),
            logo: activeBiz.logo || activeBiz.logoUrl || getBizCoverImage(activeBiz),
            images: allPhotos,
            photos: allPhotos,
            gallery: allPhotos,
            highlights: activeBiz.highlights || []
          }],
          quickReplies: [
            lang === 'hy' ? "🍽️ Դիտել մենյուն" : lang === 'ru' ? "🍽️ Меню" : "🍽️ View Menu",
            lang === 'hy' ? "📅 Ամրագրել սեղան" : lang === 'ru' ? "📅 Забронировать" : "📅 Book Table",
            lang === 'hy' ? "📍 Տեղադրություն" : lang === 'ru' ? "📍 Локация" : "📍 Location"
          ],
          sessionId
        });
      }
    }

    // --- A. IF USER IS ASKING FOR BUSINESS ADDRESSES / BRANCHES OR BOOKING ---
    if ((isLocationQuery || isBookingIntent) && targetedBiz) {
      let locations = targetedBiz.locations || [];
      if (locations.length === 0) {
        try {
          const locRes = await axios.get(`${apiUrl}/businesses/${targetedBiz._id}/locations`, { timeout: 5000 });
          locations = locRes.data?.data || [];
        } catch (_) {}
      }

      session.selectedBizId = targetedBiz._id;
      session.selectedBizName = targetedBiz.name;

      if (locations.length > 0) {
        session.step = 'booking_location';
        sessions.set(sessionId, session);

        const locSuggestions = locations.map((loc: any) => ({
          id: loc._id,
          name: loc.name || targetedBiz.name,
          category: "Location",
          rating: targetedBiz.rating || 5,
          city: loc.city || "Yerevan",
          address: loc.address,
          phone: loc.phone || targetedBiz.phone || "",
          shortDescription: `${loc.address || ''}${loc.city ? ` (${loc.city})` : ''}`,
          slug: targetedBiz.slug || "biz",
          plan: targetedBiz.plan || "standard",
          latitude: loc.coordinates?.latitude || targetedBiz.coordinates?.latitude || 40.1792,
          longitude: loc.coordinates?.longitude || targetedBiz.coordinates?.longitude || 44.4991,
        }));

        const prompts = {
          hy: `Ահա «**${targetedBiz.name}**»-ի մասնաճյուղերի հասցեները:\n\nԿարող եք ընտրել Ձեզ հարմար հասցեն՝ սեղան ամրագրելու համար 👇`,
          ru: `Вот филиалы «**${targetedBiz.name}**»:\n\nВыберите подходящий адрес для бронирования столика 👇`,
          en: `Here are the branch locations for «**${targetedBiz.name}**»:\n\nPlease select your preferred address to book a table 👇`
        };

        return NextResponse.json({
          response: prompts[lang],
          intent: "show_location_picker",
          suggestions: locSuggestions,
          quickReplies: [],
          sessionId
        });
      } else {
        const singleAddress = `${targetedBiz.address || ''}${targetedBiz.city ? ` (${targetedBiz.city})` : ''}`;
        session.selectedLocationAddress = singleAddress;
        session.selectedLocationName = targetedBiz.name;

        let bizOffers: any[] = [];
        try {
          const offRes = await axios.get(`${apiUrl}/offers/ai-search?businessId=${targetedBiz._id}`, { timeout: 5000 });
          bizOffers = offRes.data?.data || [];
        } catch (_) {}

        const availCuisines = getBusinessCuisines(targetedBiz, bizOffers);
        session.availableCuisines = availCuisines;
        session.step = 'booking_cuisine';
        sessions.set(sessionId, session);

        const quickReplies = availCuisines.map(cKey => {
          const meta = CUISINE_DICTIONARY[cKey];
          const label = meta ? (lang === 'ru' ? meta.ru : lang === 'en' ? meta.en : meta.hy) : cKey;
          const emoji = CUISINE_EMOJIS[cKey] || "🍽️";
          return `${emoji} ${label}`;
        });

        const prompts = {
          hy: `Ընտրված է՝ «**${targetedBiz.name}**» (${singleAddress}) 📍\n\nԻ՞նչ խոհանոց եք նախընտրում այս հաստատությունում 👇`,
          ru: `Выбрано: «**${targetedBiz.name}**» (${singleAddress}) 📍\n\nКакую кухню вы предпочитаете в этом заведении? 👇`,
          en: `Selected: «**${targetedBiz.name}**» (${singleAddress}) 📍\n\nWhich cuisine do you prefer at this venue? 👇`
        };

        return NextResponse.json({
          response: prompts[lang],
          intent: "ask_cuisine",
          suggestions: [],
          quickReplies,
          sessionId
        });
      }
    }

    let intent = "chat";
    let suggestions: any[] = [];
    let customContext = "";
    let directSynthesisFallback = "";

    // --- B. TARGETED BUSINESS QUERY (MENU OR SPECIFIC OFFERS) ---
    if (targetedBiz) {
      let bizOffers: any[] = [];
      if (isExplicitOfferQuery) {
        try {
          const offRes = await axios.get(`${apiUrl}/offers/ai-search?businessId=${targetedBiz._id}`, { timeout: 5000 });
          bizOffers = offRes.data?.data || [];
        } catch (e) {}
      }

      const menuItems = targetedBiz.menu || [];
      const services = targetedBiz.services || [];
      const locations = targetedBiz.locations || [];

      if (isExplicitOfferQuery && bizOffers.length > 0) {
        suggestions = bizOffers.map((o: any) => ({
          id: o._id,
          name: targetedBiz.name,
          category: o.cuisine || targetedBiz.category?.name || "Restaurant",
          rating: targetedBiz.rating || 5,
          city: o.location || targetedBiz.city || targetedBiz.address || "Yerevan",
          shortDescription: o.packageName,
          slug: targetedBiz.slug || "biz",
          plan: targetedBiz.plan || "standard",
          packageName: o.packageName,
          price: o.price,
          pax: o.pax,
          atmosphere: o.atmosphere,
          location: o.location || targetedBiz.address,
          cuisine: o.cuisine,
          dishesHy: o.dishes?.join(", "),
          dishesEn: o.dishesEn?.join(", "),
          dishesRu: o.dishesRu?.join(", "),
        }));
        intent = "show_results";
      } else {
        // Show Business Card for general or menu inquiries
        suggestions = [{
          id: targetedBiz._id,
          name: targetedBiz.name,
          category: targetedBiz.category?.name || "HoReCa",
          rating: targetedBiz.rating || 5,
          city: targetedBiz.city || targetedBiz.address || "Yerevan",
          shortDescription: targetedBiz.shortDescription || targetedBiz.description || "Վայր հանգստի և ընթրիքի համար",
          slug: targetedBiz.slug || "biz",
          plan: targetedBiz.plan || "standard",
          latitude: targetedBiz.coordinates?.latitude || 40.1792,
          longitude: targetedBiz.coordinates?.longitude || 44.4991,
          coverImage: getBizCoverImage(targetedBiz),
          logo: targetedBiz.logo || targetedBiz.logoUrl || getBizCoverImage(targetedBiz),
          images: targetedBiz.images || [],
          image: getBizCoverImage(targetedBiz)
        }];
        intent = "select_business";
      }

      customContext = `\n\nCRITICAL CONTEXT: The user is specifically asking about "${targetedBiz.name}" (Location: ${targetedBiz.city || targetedBiz.address || 'Yerevan'}, Rating: ${targetedBiz.rating || 5}/5).
BRANCH LOCATIONS: ${JSON.stringify(locations.map((l: any) => ({ name: l.name, city: l.city, address: l.address, phone: l.phone })))}
MENU DISHES: ${JSON.stringify(menuItems.map((m: any) => ({ name: m.name, price: `${m.price} AMD`, description: m.description, category: m.category })))}
SERVICES: ${JSON.stringify(services.map((s: any) => ({ name: s.name, price: `${s.price} AMD` })))}
PACKAGES/OFFERS: ${JSON.stringify(bizOffers.map((o: any) => ({ name: o.packageName, price: `${o.price} AMD`, pax: `${o.pax} persons`, dishes: o.dishes, atmosphere: o.atmosphere })))}

ABSOLUTE MANDATORY RULES:
1. Focus 100% EXCLUSIVELY on "${targetedBiz.name}".
2. DO NOT mention, compare, reference, or bring up any previously discussed restaurants, venues, or topics from prior messages.
3. Answer the user's question about "${targetedBiz.name}" in ${lang === 'hy' ? 'Armenian' : lang === 'ru' ? 'Russian' : 'English'}. If asked for menu, present dishes with prices in AMD. If asked for packages, present packages.`;

      // Direct fallback
      const dishesText = menuItems.length > 0
        ? `\n\n🍽️ **Մենյուի ուտեստներ**:\n` + menuItems.map((m: any) => `* **${m.name}** — ${(m.price || 0).toLocaleString()} AMD${m.description ? ` (${m.description})` : ''}`).join('\n')
        : '';
      const offersText = bizOffers.length > 0
        ? `\n\n🎁 **Հատուկ առաջարկներ / Սեթեր**:\n` + bizOffers.map((o: any) => `* **${o.packageName}** — ${(o.price || 0).toLocaleString()} AMD (👥 ${o.pax} անձ)`).join('\n')
        : '';
      directSynthesisFallback = `Ահա **«${targetedBiz.name}»**-ի տեղեկատվությունը․${dishesText}${offersText}\n\nՑանկանո՞ւմ եք սեղան ամրագրել այստեղ:`;

    } else if (isExplicitOfferQuery) {
      // --- C. EXPLICIT OFFER SEARCH BY CRITERIA (PAX, BUDGET, ATMOSPHERE) ---
      try {
        const paxMatch = cleanLower.match(/(\d+)\s*(անձ|հոգ|մարդ|person|people|pax|человек)/);
        const priceMatch = cleanLower.match(/(\d+)\s*(դրամ|amd|֏|rub|usd|\$|հազար)/);
        const paxVal = paxMatch ? paxMatch[1] : undefined;
        const maxPriceVal = priceMatch ? (priceMatch[2] === 'հազար' ? String(Number(priceMatch[1]) * 1000) : priceMatch[1]) : undefined;

        let atmosphereVal: string | undefined = undefined;
        if (cleanLower.includes('ընտանեկան') || cleanLower.includes('family')) atmosphereVal = 'family';
        if (cleanLower.includes('ընկեր') || cleanLower.includes('friends')) atmosphereVal = 'friends';
        if (cleanLower.includes('ռոմանտիկ') || cleanLower.includes('romantic')) atmosphereVal = 'romantic';

        const queryParams = new URLSearchParams();
        if (paxVal) queryParams.set("pax", paxVal);
        if (maxPriceVal) queryParams.set("maxPrice", maxPriceVal);
        if (atmosphereVal) queryParams.set("atmosphere", atmosphereVal);

        const res = await axios.get(`${apiUrl}/offers/ai-search?${queryParams.toString()}`, { timeout: 6000 });
        const dbOffers = res.data.data || [];

        if (dbOffers.length > 0) {
          suggestions = dbOffers.map((o: any) => ({
            id: o._id,
            name: o.business?.name || o.packageName,
            category: o.cuisine || "Restaurant",
            rating: o.business?.rating || 5,
            city: o.location || "Yerevan",
            shortDescription: o.packageName,
            slug: o.business?.slug || "biz",
            plan: o.business?.plan || "standard",
            packageName: o.packageName,
            price: o.price,
            pax: o.pax,
            atmosphere: o.atmosphere,
            location: o.location,
            cuisine: o.cuisine,
            dishesHy: Array.isArray(o.dishes) ? o.dishes.join(", ") : o.dishes,
            dishesEn: Array.isArray(o.dishesEn) ? o.dishesEn.join(", ") : o.dishesEn,
            dishesRu: Array.isArray(o.dishesRu) ? o.dishesRu.join(", ") : o.dishesRu,
          }));
          intent = "show_results";
          customContext = `\n\nOFFERS MATCHING CRITERIA: ${JSON.stringify(suggestions.map(s => ({ name: s.name, packageName: s.packageName, price: s.price, pax: s.pax })))}. Present these offers to the user in ${lang === 'hy' ? 'Armenian' : lang === 'ru' ? 'Russian' : 'English'}.`;
          directSynthesisFallback = `Ահա Ձեր նշած պահանջներին համապատասխան լավագույն առաջարկները 👇`;
        }
      } catch (e) {
        console.error("Offer criteria search error:", e);
      }

    } else {
      // --- D. DISTRICT & GENERAL CATEGORY SEARCH ---
      let searchParam = "";
      let matchedLabel = "";

      if (cleanLower.includes("նորք մարաշ") || cleanLower.includes("նորք-մարաշ") || cleanLower.includes("մարաշ") || cleanLower.includes("marash") || translitLower.includes("marash") || translitLower.includes("norq")) {
        searchParam = "Marash";
        matchedLabel = "Նորք-Մարաշ";
      } else if (cleanLower.includes("նոր նորք") || cleanLower.includes("nor nork") || cleanLower.includes("nor norq") || translitLower.includes("nor nork")) {
        searchParam = "Nor Nork";
        matchedLabel = "Նոր Նորք";
      } else if (cleanLower.includes("կենտրոն") || cleanLower.includes("kentron") || cleanLower.includes("center") || translitLower.includes("kentron")) {
        searchParam = "Kentron";
        matchedLabel = "Կենտրոն";
      } else if (cleanLower.includes("արաբկիր") || cleanLower.includes("arabkir") || translitLower.includes("arabkir")) {
        searchParam = "Arabkir";
        matchedLabel = "Արաբկիր";
      } else if (cleanLower.includes("սևան") || cleanLower.includes("sevan") || translitLower.includes("sevan")) {
        searchParam = "Sevan";
        matchedLabel = "Սևան";
      } else if (cleanLower.includes("աբովյան") || cleanLower.includes("abovyan") || translitLower.includes("abovyan")) {
        searchParam = "Abovyan";
        matchedLabel = "Աբովյան";
      } else if (cleanLower.includes("ջրվեժ") || cleanLower.includes("jrvej") || translitLower.includes("jrvej")) {
        searchParam = "Jrvej";
        matchedLabel = "Ջրվեժ";
      }

      const isExplicitVenueSearch = !isTopicChangeOrDiscussion && (
        searchParam !== "" || 
        /(?:^|\s)(?:ռեստորան|սրճարան|լաունջ|բար|պաբ|կաֆե|պանդոկ|պիցցերիա|հացատուն|ճաշարան)(?:ներ|ը|ն|եր|ում|ից)?(?:\s|$)/i.test(cleanLower) ||
        /վայր\s*(գտ|փնտր|առաջարկ)|տեղ\s*(գտ|փնտր|առաջարկ)|ուտելու\s*տեղ|խմելու\s*տեղ|restaurant|cafe|lounge|\bbar\b|\bpub\b|pizzeria|food\s*place|places\s*to\s*eat|find\s*(a\s*)?(restaurant|cafe|bar|venue|place)|suggest\s*(a\s*)?(restaurant|cafe|bar|venue|place)|ресторан|кафе|\bбар\b|\bпаб\b|пиццери|где\s*поесть|посоветуй\s*(ресторан|кафе|бар|место)/i.test(cleanLower)
      );

      if (isExplicitVenueSearch) {
        let matched = allBusinesses;
        if (searchParam) {
          matched = allBusinesses.filter((b: any) => {
            const allLoc = `${b.city} ${b.address} ${(b.locations || []).map((l: any) => l.city + " " + l.address).join(" ")}`.toLowerCase();
            return allLoc.includes(searchParam.toLowerCase()) || allLoc.includes(matchedLabel.toLowerCase());
          });
          if (matched.length === 0) matched = allBusinesses.slice(0, 5);
        } else {
          matched = allBusinesses.slice(0, 5);
        }

        suggestions = matched.slice(0, 5).map((b: any) => ({
          id: b._id,
          name: b.name,
          category: b.category?.name || "HoReCa",
          rating: b.rating || 5,
          city: b.city || b.address || "Yerevan",
          shortDescription: b.shortDescription || b.description || "Վայր հանգստի և ընթրիքի համար",
          slug: b.slug || "biz",
          plan: b.plan || "standard",
          latitude: b.coordinates?.latitude || b.lat || 40.1792,
          longitude: b.coordinates?.longitude || b.lng || 44.4991,
          coverImage: getBizCoverImage(b),
          logo: b.logo || b.logoUrl || getBizCoverImage(b),
          images: b.images || [],
          image: getBizCoverImage(b)
        }));

        if (cleanLower.includes('քարտեզ') || cleanLower.includes('map') || cleanLower.includes('карта')) {
          intent = "show_map";
        } else if (suggestions.length > 0) {
          intent = "select_business";
        }

        customContext = `\n\nDATABASE VENUES: ${JSON.stringify(suggestions.map(s => ({ name: s.name, location: s.city, rating: s.rating })))}. Recommend these venues in ${lang === 'hy' ? 'Armenian' : lang === 'ru' ? 'Russian' : 'English'}, highlighting the specific area (${matchedLabel || 'Yerevan'}).`;
        directSynthesisFallback = matchedLabel 
          ? `Ահա ${matchedLabel}-ում գտնվող լավագույն վայրերը 👇`
          : `Ահա առաջարկվող լավագույն վայրերը 👇`;
      } else {
        // Pure conversation, advice, questions, or topic discussion without business cards
        suggestions = [];
        intent = "chat";
        customContext = "";
      }
    }

    // --- GEMINI LLM CALL ---
    const conversationHistory: any[] = [];
    // Only pass conversation history if we are in an active follow-up for the SAME business.
    // If targetedBiz is null or user asked about something else, pass 0 old messages so previous businesses are NEVER cited!
    if (targetedBiz && !isExplicitNewBusinessTargeted && !isTopicChangeOrDiscussion && session.messages && session.messages.length > 0) {
      for (const m of session.messages.slice(-4)) {
        if (m && m.role && typeof m.content === 'string') {
          conversationHistory.push({ role: m.role, content: m.content });
        }
      }
    }

    if (body.imageUrl) {
      conversationHistory.push({
        role: "user",
        content: [
          { type: "text", text: message || "Analyze this image" },
          { type: "image_url", image_url: { url: body.imageUrl } }
        ]
      });
    } else {
      conversationHistory.push({ role: "user", content: message });
    }

    let answer = "";
    try {
      answer = await callGemini([
        { role: "system", content: systemPrompt + customContext },
        ...conversationHistory
      ]);
    } catch (e) {
      answer = directSynthesisFallback || (
        lang === 'hy' ? "Բարև Ձեզ 👋 Ես Treeo-ի AI կոնսիերժն եմ: Ի՞նչ վայր կամ ճաշացանկ եք փնտրում այսօր:" : "Hello 👋 How can I help you today?"
      );
    }

    session.messages.push({ role: "user", content: message });
    session.messages.push({ role: "assistant", content: answer });
    sessions.set(sessionId, session);

    const defaultReplies = (suggestions && suggestions.length > 0) || isTopicChangeOrDiscussion || intent === "show_results" || intent === "select_business" || intent === "show_gallery" || intent === "chat"
      ? []
      : (lang === 'hy' ? ["🍽️ Ռեստորաններ", "☕ Սրճարաններ", "🍷 Լաունջ / Բար"] : ["🍽️ Restaurants", "☕ Cafes", "🍷 Lounge / Bar"]);

    return NextResponse.json({
      response: answer,
      intent,
      suggestions,
      quickReplies: defaultReplies,
      sessionId
    });

  } catch (error: any) {
    console.error("Chat API Error:", error?.response?.data || error?.message || error);

    return NextResponse.json({
      response: "Բարև Ձեզ 👋 Ես Treeo-ի AI կոնսիերժն եմ: Ի՞նչ վայր կամ ճաշացանկ եք փնտրում այսօր:",
      intent: "chat",
      suggestions: [],
      quickReplies: [],
      sessionId: `session-${Date.now()}`
    });
  }
}
