import { NextRequest, NextResponse } from "next/server";
import { MOCK_BUSINESSES } from "@/data/mock-businesses";

interface ChatRequest {
  message: string;
  sessionId?: string;
}

// Global session store
interface ChatSession {
  step: 'ask_pax' | 'ask_budget' | 'booking_datetime' | 'booking_details' | 'booking_confirm' | null;
  pax?: number;
  budget?: number;
  location?: string;
  atmosphere?: string;
  selectedBizId?: string;
  selectedBizName?: string;
  bookingDateTime?: string;
}

const getSessions = (): Map<string, ChatSession> => {
  if (!(global as any).aiSessions) {
    (global as any).aiSessions = new Map<string, ChatSession>();
  }
  return (global as any).aiSessions;
};

function calculateScore(business: any): number {
  const rating = business.ratingAvg || 0;
  let multiplier = 1.0;
  if (business.plan === 'premium') multiplier = 1.5;
  else if (business.plan === 'standard') multiplier = 1.2;
  return rating * multiplier;
}

function extractHoreca() {
  return MOCK_BUSINESSES.filter(b => b.category.slug === "horeca" || b.categoryId === "cat-horeca");
}

export async function POST(request: NextRequest) {
  const body: ChatRequest = await request.json();
  const { message } = body;
  const sessionId = body.sessionId || `session-${Date.now()}`;

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const lower = message.toLowerCase().trim();
  const sessions = getSessions();
  let session = sessions.get(sessionId) || { step: null };

  let content = "";
  let intent = "flow";
  let suggestions: any[] = [];
  let quickReplies: string[] = [];

  // Handle Book Trigger
  if (lower.startsWith("book id:")) {
    const bizId = lower.split("book id:")[1]?.trim();
    const biz = MOCK_BUSINESSES.find(b => b.id === bizId);
    if (biz) {
      session.step = 'booking_datetime';
      session.selectedBizId = biz.id;
      session.selectedBizName = biz.name;
      sessions.set(sessionId, session);

      return NextResponse.json({
        response: `Հիանալի ընտրություն: Ո՞ր օրվա և ժամի համար եք ցանկանում հաստատել այս ամրագրումը **${biz.name}**-ում:`,
        intent: "show_datetime_picker",
        suggestions: [],
        quickReplies: [],
        sessionId
      });
    }
  }

  // Handle Booking DateTime
  if (session.step === 'booking_datetime') {
    session.bookingDateTime = message; // Should be the selected ISO string or text
    session.step = 'booking_details';
    sessions.set(sessionId, session);

    return NextResponse.json({
      response: `Խնդրում եմ նշել Ձեր անունը և հեռախոսահամարը, որպեսզի ռեստորանը կարողանա կապ հաստատել Ձեզ հետ: Ունե՞ք հատուկ ցանկություններ (օրինակ՝ ալերգիաներ կամ մանկական աթոռ):`,
      intent: "ask_booking_details",
      suggestions: [],
      quickReplies: [],
      sessionId
    });
  }

  // Handle Booking Confirmation
  if (session.step === 'booking_details') {
    const details = message;
    session.step = 'booking_confirm';
    sessions.set(sessionId, session);

    return NextResponse.json({
      response: `Խնդրում եմ ստուգել ամրագրման մանրամասները և հաստատել:`,
      intent: "show_summary_card",
      suggestions: [{
        id: "summary",
        name: session.selectedBizName || "",
        category: "Summary",
        rating: 0,
        city: "",
        shortDescription: `Անձանց քանակ: ${session.pax || 2} հոգի\nԺամանակ: ${session.bookingDateTime}\nՄանրամասներ: ${details}`,
        slug: "",
        plan: "starter"
      }],
      quickReplies: [],
      sessionId
    });
  }

  // Handle Final Success
  if (session.step === 'booking_confirm') {
    if (lower === "confirm_booking" || lower.includes("հաստատել")) {
      session.step = null;
      sessions.delete(sessionId);

      return NextResponse.json({
        response: `Ձեր ամրագրումը հաստատված է: Սպասում ենք Ձեզ:\nԱհա Ձեր ամրագրման կոդը՝ **#${Math.floor(10000 + Math.random() * 90000)}**\n\n(Բիզնեսը ավտոմատ ստացավ այս ծանուցումը վահանակում):`,
        intent: "booking_success",
        suggestions: [],
        quickReplies: ["🍽️ Նոր որոնում", "Գլխավոր էջ"],
        sessionId
      });
    }
  }

  // 1. Trigger Start of Flow -> Step 1: Pax
  if (lower === "restaurants" || lower.includes("ռեստորաններ") || lower === "🍽️ restaurants" || (lower.includes("restaurant") && !session.step)) {
    session.step = 'ask_pax';
    sessions.set(sessionId, session);

    return NextResponse.json({
      response: "Քանի՞ անձի համար եք նախատեսում ամրագրումը:",
      intent: "ask_pax",
      suggestions: [],
      quickReplies: ["2 անձ", "4 անձ", "6 անձ", "10+ անձ"],
      sessionId
    });
  }

  // QUESTION 1: Pax -> QUESTION 2: Budget
  if (session.step === 'ask_pax') {
    const paxMatch = lower.match(/(\d+)/);
    if (!paxMatch) {
      return NextResponse.json({
        response: "Խնդրում եմ նշեք հստակ թիվ (օրինակ՝ 2, 4):",
        intent: "ask_pax",
        suggestions: [],
        quickReplies: ["2 անձ", "4 անձ", "6 անձ", "10+ անձ"],
        sessionId
      });
    }

    session.pax = parseInt(paxMatch[1]);
    session.step = 'ask_budget';
    sessions.set(sessionId, session);

    return NextResponse.json({
      response: "Որքա՞ն գումար եք նախատեսում ամրագրման համար:",
      intent: "ask_budget",
      suggestions: [],
      quickReplies: ["10,000 AMD", "20,000 AMD", "30,000 AMD"],
      sessionId
    });
  }

  // 4. Flow: Budget -> Results & Fallbacks
  if (session.step === 'ask_budget') {
    const budgetMatch = lower.match(/(\d+)/);
    if (!budgetMatch) {
      return NextResponse.json({
        response: "Խնդրում եմ նշեք գումարի չափը թվերով (օրինակ՝ 15000):",
        intent: "ask_budget",
        suggestions: [],
        quickReplies: [],
        sessionId
      });
    }

    session.budget = parseInt(budgetMatch[1]);

    // Process Results
    const targetCity = (session.location || "Yerevan").toLowerCase();
    let candidates = extractHoreca();

    // Filter by exact location
    let exactCandidates = candidates.filter(b => b.city.toLowerCase().includes(targetCity));

    // Filter by budget (Mock logic: simulate some expensive places)
    // Let's say Premium businesses cost 25000+, Pro 15000+, Starter 5000+
    const getMockPrice = (b: any) => b.plan === 'premium' ? 25000 : (b.plan === 'standard' ? 15000 : 5000);

    let validExactCandidates = exactCandidates.filter(b => getMockPrice(b) <= (session.budget || 0));

    // Fallback Logic
    let fallbackType = null;
    let finalCandidates = [...validExactCandidates];

    if (validExactCandidates.length === 0) {
      // Priority 1: Expand budget by 20%
      const expandedBudget = (session.budget || 0) * 1.2;
      const expandedCandidates = exactCandidates.filter(b => getMockPrice(b) <= expandedBudget);

      if (expandedCandidates.length > 0) {
        fallbackType = "priority1";
        finalCandidates = expandedCandidates;
      } else {
        // Priority 3: Change location
        const otherLocationsCandidates = candidates.filter(b => !b.city.toLowerCase().includes(targetCity) && getMockPrice(b) <= (session.budget || 0));
        if (otherLocationsCandidates.length > 0) {
          fallbackType = "priority3";
          finalCandidates = otherLocationsCandidates;
        }
      }
    }

    // Apply Ranking Formula
    finalCandidates.sort((a, b) => calculateScore(b) - calculateScore(a));

    if (finalCandidates.length > 0) {
      if (fallbackType === "priority1") {
        content = `Ցավոք, ճիշտ Ձեր նշած բյուջեով հասանելի առաջարկներ չկան, սակայն ունենք հիանալի տարբերակներ մոտակա գնային միջակայքում: Դիտարկե՞նք դրանք.\n\n`;
      } else {
        content = `Գտա հետևյալ ռեստորանները **${session.pax} անձի** համար՝ **${session.budget} AMD** բյուջեով:\n\nԱրդյունքները դասավորված են ըստ որակի.\n\n`;
      }

      content += finalCandidates.slice(0, 3).map((b, i) => {
        const planStr = b.plan === 'premium' ? "🥇 Premium" : b.plan === 'standard' ? "🥈 Pro" : "⭐ Standard";
        return `${i + 1}. **${b.name}** (${planStr}) - ${b.ratingAvg} վարկանիշ (Սկսած ${getMockPrice(b)} AMD)`;
      }).join("\n");

      suggestions = finalCandidates.slice(0, 3).map((b, idx) => ({
        id: b.id,
        name: b.name,
        category: b.category.name,
        rating: b.ratingAvg,
        city: b.city,
        shortDescription: b.shortDescription,
        slug: b.slug,
        plan: b.plan,
        packageName: `Սեթ No ${idx + 1}`,
        price: session.budget || getMockPrice(b) || 13000,
        pax: session.pax || 2,
        atmosphere: session.atmosphere || 'family',
        location: b.address || `${b.name}, ${b.city}`,
        dishesHy: (b as any).menu ? (b as any).menu.map((m: any) => m.name).join(", ") : "Խոզի խորոված, Խաչապուրի, Գինի",
        dishesEn: "Pork Khorovats, Khachapuri, Wine",
        dishesRu: "Шашлык из свинины, Хачапури, Вино"
      }));
    } else {
      content = "Ներողություն, այս չափանիշներով նույնիսկ մոտակա տարածքներում կամ բյուջեով ռեստորաններ չգտնվեցին: Խնդրում եմ փորձել ավելացնել բյուջեն:";
    }

    quickReplies = ["Նոր որոնում", "🚗 Car Services"];

    // Reset session
    sessions.delete(sessionId);

    return NextResponse.json({
      response: content,
      intent: "show_results",
      suggestions,
      quickReplies,
      sessionId
    });
  }

  // 3. Greeting and Fallbacks
  if (lower.match(/^(hi|hello|hey|barev|privet|բարև)/)) {
    return NextResponse.json({
      response: `Barev! 👋 I'm your Findy AI assistant. Ինչպե՞ս կարող եմ օգնել ձեզ այսօր:\n\nԴուք կարող եք սկսել որոնումը՝ սեղմելով "🍽️ Restaurants" կոճակը:`,
      intent: "greeting",
      suggestions: [],
      quickReplies: ["🍽️ Restaurants", "🚗 Car Services", "🏨 Hotels & Spas"],
      sessionId
    });
  }

  // Fallback for everything else
  return NextResponse.json({
    response: "Խնդրում եմ ընտրել ոլորտը՝ որոնումը սկսելու համար:",
    intent: "fallback",
    suggestions: [],
    quickReplies: ["🍽️ Restaurants", "🚗 Car Services"],
    sessionId
  });
}
