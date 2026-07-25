"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { getApiUrl } from "@/lib/utils";
import { useI18n } from "@/i18n";
import axios from "axios";
import Link from "next/link";
import { Plus, Trash2, Edit2, Utensils, Users, MapPin, Tag, Lock, Loader2, Languages, AlertCircle, Globe, ChevronDown, Sparkles, Check } from "lucide-react";

interface Offer {
  _id: string;
  packageName: string;
  dishes: string[];
  dishesEn?: string[];
  dishesRu?: string[];
  pax: number;
  price: number;
  inclusions: string[];
  location: string;
  atmosphere?: string;
}

type LangKey = 'hy' | 'en' | 'ru';

// High-precision Dish Dictionary for common dishes/drinks across HY, EN, RU
const DISH_GLOSSARY: Record<string, { hy: string; en: string; ru: string }> = {
  // Meats & Khorovats
  "խոզի խորոված": { hy: "Խոզի խորոված", en: "Pork Khorovats (Pork BBQ)", ru: "Шашлык из свинины" },
  "տավարի խորոված": { hy: "Տավարի խորոված", en: "Beef Khorovats (Beef BBQ)", ru: "Шашлык из говядины" },
  "հավի խորոված": { hy: "Հավի խորոված", en: "Chicken Khorovats", ru: "Шашлык из курицы" },
  "գառան խորոված": { hy: "Գառան խորոված", en: "Lamb Khorovats", ru: "Шашлык из баранины" },
  "խորոված": { hy: "Խորոված", en: "Khorovats (BBQ)", ru: "Шашлык" },
  "խոզի չալաղաջ": { hy: "Խոզի չալաղաջ", en: "Pork Loin Chops (Chalagach)", ru: "Свиные ребрышки (Чалагач)" },
  "լուլա քաբաբ": { hy: "Լուլա քաբաբ", en: "Lula Kebab", ru: "Люля-кебаб" },
  "քաբաբ": { hy: "Քաբաբ", en: "Kebab", ru: "Кебаб" },
  "հավի թևիկներ": { hy: "Հավի թևիկներ", en: "Chicken Wings", ru: "Куриные крылышки" },

  // Traditional Armenian Dishes
  "խաչապուրի": { hy: "Խաչապուրի", en: "Khachapuri", ru: "Хачапури" },
  "աջարական խաչապուրի": { hy: "Աջարական խաչապուրի", en: "Adjarian Khachapuri", ru: "Хачапури по-аджарски" },
  "լահմաջո": { hy: "Լահմաջո", en: "Lahmajun", ru: "Лахмаджо" },
  "լամաջո": { hy: "Լամաջո", en: "Lahmajun", ru: "Лахмаджо" },
  "ժենգյալով հաց": { hy: "Ժենգյալով հաց", en: "Zhengyalov Hats", ru: "Женгялов хац" },
  "խաշ": { hy: "Խաշ", en: "Khash", ru: "Хаш" },
  "սպաս": { hy: "Սպաս", en: "Spas (Yogurt Soup)", ru: "Спас (Танов суп)" },
  "քյուֆթա": { hy: "Քյուֆթա", en: "Kyufta", ru: "Кюфта" },
  "քուֆթա": { hy: "Քուֆթա", en: "Kyufta", ru: "Кюфта" },
  "տոլմա": { hy: "Տոլմա", en: "Dolma (Tolma)", ru: "Долма" },
  "դոլմա": { hy: "Դոլմա", en: "Dolma (Tolma)", ru: "Долма" },
  "թփով տոլմա": { hy: "Թփով տոլմա", en: "Grape Leaf Dolma", ru: "Долма в виноградных листьях" },
  "պասուց տոլմա": { hy: "Պասուց տոլմա", en: "Pasuts Dolma (Lenten Dolma)", ru: "Пасуц долма" },
  "ղափամա": { hy: "Ղափամա", en: "Ghapama (Stuffed Pumpkin)", ru: "Хапама (Фаршированная тыква)" },
  "հարիսա": { hy: "Հարիսա", en: "Harissa", ru: "Ариса" },
  "բաստուրմա": { hy: "Բաստուրմա", en: "Basturma", ru: "Бастурма" },
  "սուջուխ": { hy: "Սուջուխ", en: "Sujuk", ru: "Суджук" },

  // Salads & Starters
  "ամառային աղցան": { hy: "Ամառային աղցան", en: "Summer Salad", ru: "Летний салат" },
  "աղցան": { hy: "Աղցան", en: "Salad", ru: "Салат" },
  "կեսար աղցան": { hy: "Կեսար աղցան", en: "Caesar Salad", ru: "Салат Цезарь" },
  "ցեզար աղցան": { hy: "Ցեզար աղցան", en: "Caesar Salad", ru: "Салат Цезарь" },
  "ցեզար": { hy: "Ցեզար աղցան", en: "Caesar Salad", ru: "Салат Цезарь" },
  "հունական աղցան": { hy: "Հունական աղցան", en: "Greek Salad", ru: "Греческий салат" },
  "մայրաքաղաքային աղցան": { hy: "Մայրաքաղաքային աղցան", en: "Olivier Salad (Capital Salad)", ru: "Салат Оливье (Столичный)" },
  "տաբուլե": { hy: "Տաբուլե", en: "Tabbouleh", ru: "Табуле" },
  "հումուս": { hy: "Հումուս", en: "Hummus", ru: "Хумус" },
  "պանրի տեսականի": { hy: "Պանրի տեսականի", en: "Cheese Platter", ru: "Сырное ассорти" },
  "մսի տեսականի": { hy: "Մսի տեսականի", en: "Meat Platter", ru: "Мясное ассорти" },
  "թթվի տեսականի": { hy: "Թթվի տեսականի", en: "Pickle Platter", ru: "Соленья ассорти" },
  "հացի տեսականի": { hy: "Հացի տեսականի", en: "Bread Basket", ru: "Хлебная корзина" },
  "լավաշ": { hy: "Լավաշ", en: "Lavash Bread", ru: "Лаваш" },

  // Seafood & Fast Food
  "իշխան": { hy: "Իշխան ձուկ", en: "Ishkhan (Sevan Trout)", ru: "Севанская форель (Ишхан)" },
  "իշխան ձուկ": { hy: "Իշխան ձուկ", en: "Ishkhan (Sevan Trout)", ru: "Севанская форель (Ишхан)" },
  "սիգ": { hy: "Սիգ ձուկ", en: "Sig (Whitefish)", ru: "Сиг" },
  "սիգ ձուկ": { hy: "Սիգ ձուկ", en: "Sig (Whitefish)", ru: "Сиг" },
  "սթեյք": { hy: "Սթեյք", en: "Steak", ru: "Стейк" },
  "պիցցա": { hy: "Պիցցա", en: "Pizza", ru: "Пицца" },
  "բուրգեր": { hy: "Բուրգեր", en: "Burger", ru: "Бургер" },
  "կարտոֆիլ ֆրի": { hy: "Կարտոֆիլ ֆրի", en: "French Fries", ru: "Картофель фри" },
  "ֆրի": { hy: "Ֆրի", en: "French Fries", ru: "Картофель фри" },

  // Drinks
  "գինի": { hy: "Գինի", en: "Wine", ru: "Вино" },
  "կարմիր գինի": { hy: "Կարմիր գինի", en: "Red Wine", ru: "Красное вино" },
  "սպիտակ գինի": { hy: "Սպիտակ գինի", en: "White Wine", ru: "Белое вино" },
  "գարեջուր": { hy: "Գարեջուր", en: "Beer", ru: "Пиво" },
  "օղի": { hy: "Օղի", en: "Vodka", ru: "Водка" },
  "կոնյակ": { hy: "Կոնյակ", en: "Armenian Cognac / Brandy", ru: "Армянский Коньяк" },
  "հյութ": { hy: "Հյութ", en: "Juice", ru: "Сок" },
  "բնական հյութ": { hy: "Բնական հյութ", en: "Natural Juice", ru: "Натуральный сок" },
  "զովացուցիչ ըմպելիքներ": { hy: "Զովացուցիչ ըմպելիքներ", en: "Soft Drinks", ru: "Безалкогольные напитки" },
  "ջուր": { hy: "Հանքային ջուր / Ջուր", en: "Water / Mineral Water", ru: "Вода / Минеральная вода" },
  "սուրճ": { hy: "Սուրճ", en: "Coffee", ru: "Кофе" },
  "թեյ": { hy: "Թեյ", en: "Tea", ru: "Чай" },

  // Russian terms
  "шашлык из свинины": { hy: "Խոզի խորոված", en: "Pork Khorovats (Pork BBQ)", ru: "Шашлык из свинины" },
  "шашлык из говядины": { hy: "Տավարի խորոված", en: "Beef Khorovats (Beef BBQ)", ru: "Шашлык из говядины" },
  "шашлык из курицы": { hy: "Հավի խորոված", en: "Chicken Khorovats", ru: "Шашлык из курицы" },
  "шашлык из баранины": { hy: "Գառան խորոված", en: "Lamb Khorovats", ru: "Шашлык из баранины" },
  "шашлык": { hy: "Խորոված", en: "Khorovats (BBQ)", ru: "Шашлык" },
  "люля кебаб": { hy: "Լուլա քաբաբ", en: "Lula Kebab", ru: "Люля-кебаб" },
  "люля-кебаб": { hy: "Լուլա քաբաբ", en: "Lula Kebab", ru: "Люля-кебаб" },
  "хачапури": { hy: "Խաչապուրի", en: "Khachapuri", ru: "Хачапури" },
  "лахмаджо": { hy: "Լահմաջո", en: "Lahmajun", ru: "Лахмаджо" },
  "женгялов хац": { hy: "Ժենգյալով հաց", en: "Zhengyalov Hats", ru: "Женгялов хац" },
  "хаш": { hy: "Խաշ", en: "Khash", ru: "Хаш" },
  "спас": { hy: "Սպաս", en: "Spas", ru: "Спас" },
  "кюфта": { hy: "Քյուֆթա", en: "Kyufta", ru: "Кюфта" },
  "долма": { hy: "Տոլմա", en: "Dolma (Tolma)", ru: "Долма" },
  "салат": { hy: "Աղցան", en: "Salad", ru: "Салат" },
  "летний салат": { hy: "Ամառային աղցան", en: "Summer Salad", ru: "Летний салат" },
  "летняя салат": { hy: "Ամառային աղցան", en: "Summer Salad", ru: "Летний салат" },
  "салат цезарь": { hy: "Կեսար աղցան", en: "Caesar Salad", ru: "Салат Цезарь" },
  "греческий салат": { hy: "Հունական աղցան", en: "Greek Salad", ru: "Греческий салат" },
  "барбекю из свинины": { hy: "Խոզի խորոված", en: "Pork Khorovats (Pork BBQ)", ru: "Шашлык из свинины" },
  "картофель фри": { hy: "Կարտոֆիլ ֆրի", en: "French Fries", ru: "Картофель фри" },
  "севанская форель": { hy: "Իշխան ձուկ", en: "Ishkhan (Sevan Trout)", ru: "Севанская форель" },
  "ишхан": { hy: "Իշխան ձուկ", en: "Ishkhan (Sevan Trout)", ru: "Ишхан" },
  "вино": { hy: "Գինի", en: "Wine", ru: "Вино" },
  "пиво": { hy: "Գարեջուր", en: "Beer", ru: "Пиво" },
  "водка": { hy: "Օղի", en: "Vodka", ru: "Водка" },
  "коньяк": { hy: "Կոնյակ", en: "Armenian Cognac", ru: "Коньяк" },
  "сок": { hy: "Հյութ", en: "Juice", ru: "Сок" },

  // English terms
  "pork khorovats": { hy: "Խոզի խորոված", en: "Pork Khorovats", ru: "Шашлык из свинины" },
  "pork bbq": { hy: "Խոզի խորոված", en: "Pork BBQ", ru: "Шашлык из свинины" },
  "pork barbecue": { hy: "Խոզի խորոված", en: "Pork Barbecue", ru: "Шашлык из свинины" },
  "beef khorovats": { hy: "Տավարի խորոված", en: "Beef Khorovats", ru: "Шашлык из говядины" },
  "chicken khorovats": { hy: "Հավի խորոված", en: "Chicken Khorovats", ru: "Шашлык из курицы" },
  "khachapuri": { hy: "Խաչապուրի", en: "Khachapuri", ru: "Хачапури" },
  "khash": { hy: "Խաշ", en: "Khash", ru: "Хаш" },
  "dolma": { hy: "Տոլմա", en: "Dolma", ru: "Долма" },
  "salad": { hy: "Աղցան", en: "Salad", ru: "Салат" },
  "summer salad": { hy: "Ամառային աղցան", en: "Summer Salad", ru: "Летний салат" },
  "caesar salad": { hy: "Կեսար աղցան", en: "Caesar Salad", ru: "Салат Цезарь" },
  "french fries": { hy: "Կարտոֆիլ ֆրի", en: "French Fries", ru: "Картофель фри" },
  "wine": { hy: "Գինի", en: "Wine", ru: "Вино" },
  "beer": { hy: "Գարեջուր", en: "Beer", ru: "Пиво" },
  "vodka": { hy: "Օղի", en: "Vodka", ru: "Водка" },
  "juice": { hy: "Հյութ", en: "Juice", ru: "Сок" }
};

const fetchGoogleTranslate = async (text: string, fromLang: string, toLang: string): Promise<string | null> => {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${fromLang}&tl=${toLang}&dt=t&q=${encodeURIComponent(text.trim())}`;
    const res = await axios.get(url, { timeout: 3500 });
    if (res.data && Array.isArray(res.data[0])) {
      const parts = res.data[0].map((part: any) => part[0]).filter(Boolean);
      const full = parts.join("").trim();
      if (full) return full;
    }
  } catch (e) {}
  return null;
};

const isScriptValidForLang = (text: string, targetLang: LangKey): boolean => {
  if (!text || !text.trim()) return true;
  if (targetLang === 'ru') return /[\u0400-\u04FF]/.test(text);
  if (targetLang === 'hy') return /[\u0530-\u058F]/.test(text);
  if (targetLang === 'en') return /[a-zA-Z]/.test(text);
  return true;
};

const translateSingleDish = async (dishName: string, fromLang: LangKey, toLang: LangKey): Promise<string> => {
  const cleanKey = dishName.trim().toLowerCase();
  
  // 1. Check custom culinary glossary
  if (DISH_GLOSSARY[cleanKey] && DISH_GLOSSARY[cleanKey][toLang]) {
    return DISH_GLOSSARY[cleanKey][toLang];
  }

  // 2. Try Google Translate GTX API (High Precision)
  const gtxTrans = await fetchGoogleTranslate(dishName, fromLang, toLang);
  if (gtxTrans && isScriptValidForLang(gtxTrans, toLang)) {
    return gtxTrans.charAt(0).toUpperCase() + gtxTrans.slice(1);
  }

  // 3. Fallback to MyMemory API with strict script validation
  try {
    const res = await axios.get(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(dishName.trim())}&langpair=${fromLang}|${toLang}`, { timeout: 3000 });
    const trans = res.data?.responseData?.translatedText;
    if (trans && trans !== "NO QUERY SPECIFIED" && !trans.includes("MYMEMORY WARNING") && isScriptValidForLang(trans, toLang)) {
      return trans.charAt(0).toUpperCase() + trans.slice(1);
    }
  } catch (e) {}

  return "";
};

const translateDishList = async (fullText: string, fromLang: LangKey, toLang: LangKey): Promise<string> => {
  if (!fullText.trim()) return "";
  const items = fullText.split(/,|\n/).map(s => s.trim()).filter(Boolean);
  if (items.length === 0) return "";

  const translatedItems = await Promise.all(
    items.map(item => translateSingleDish(item, fromLang, toLang))
  );

  return translatedItems.filter(Boolean).join(", ");
};

export default function DashboardOffers() {
  const { currentUser } = useAuth();
  const { t } = useI18n();
  const offersT = (t as any).dashboard?.offers || {};

  const [activePlan, setActivePlan] = useState<string>("starter");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [hasInclusions, setHasInclusions] = useState<boolean>(false);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  // Selectable primary language state & collapsible translations
  const [primaryLang, setPrimaryLang] = useState<LangKey>('hy');
  const [showTranslations, setShowTranslations] = useState<boolean>(false);

  // Custom dropdown open states & refs
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isAtmosphereOpen, setIsAtmosphereOpen] = useState(false);

  const locationRef = useRef<HTMLDivElement>(null);
  const atmosphereRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setIsLocationOpen(false);
      }
      if (atmosphereRef.current && !atmosphereRef.current.contains(event.target as Node)) {
        setIsAtmosphereOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const loadPlan = async () => {
      try {
        const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
        if (token) {
          const subRes = await axios.get(`${getApiUrl()}/subscriptions/business/me`, { headers: { Authorization: `Bearer ${token}` } });
          if (subRes.data?.success && subRes.data.data?.plan) {
            setActivePlan(subRes.data.data.plan);
            return;
          }
        }
      } catch {}

      if (typeof window !== "undefined") {
        const profilesStr = window.localStorage.getItem("armbiz-business-profiles");
        if (profilesStr) {
          try {
            const profiles = JSON.parse(profilesStr);
            const myProfile = profiles.find((p: any) => p.ownerUsername === currentUser?.username);
            if (myProfile && (myProfile.plan || myProfile.subscriptionPlan)) {
              setActivePlan(myProfile.plan || myProfile.subscriptionPlan);
            }
          } catch (e) {}
        }
      }
    };
    loadPlan();
  }, [currentUser]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    packageName: "",
    pax: 1 as number | string,
    price: 0 as number | string,
    location: "",
    atmosphere: "family",
    dishesString: "",
    dishesEnString: "",
    dishesRuString: "",
    inclusionsString: ""
  });

  const previousPrimaryText = useRef<string>("");

  // Synchronous auto-translation & real-time clearing effect
  useEffect(() => {
    const getPrimaryValue = () => {
      if (primaryLang === 'hy') return formData.dishesString;
      if (primaryLang === 'en') return formData.dishesEnString;
      if (primaryLang === 'ru') return formData.dishesRuString;
      return "";
    };

    const text = getPrimaryValue();

    // If primary text is empty (user cleared text), synchronously clear non-primary fields immediately!
    if (!text.trim()) {
      previousPrimaryText.current = "";
      setFormData(prev => {
        const next = { ...prev };
        if (primaryLang !== 'hy') next.dishesString = "";
        if (primaryLang !== 'en') next.dishesEnString = "";
        if (primaryLang !== 'ru') next.dishesRuString = "";
        return next;
      });
      return;
    }

    if (text === previousPrimaryText.current) return;

    const timer = setTimeout(async () => {
      try {
        setIsTranslating(true);
        previousPrimaryText.current = text;

        if (primaryLang === 'hy') {
          const [enText, ruText] = await Promise.all([
            translateDishList(text, 'hy', 'en'),
            translateDishList(text, 'hy', 'ru')
          ]);
          setFormData(prev => ({
            ...prev,
            dishesEnString: enText || "",
            dishesRuString: ruText || ""
          }));
        } else if (primaryLang === 'en') {
          const [hyText, ruText] = await Promise.all([
            translateDishList(text, 'en', 'hy'),
            translateDishList(text, 'en', 'ru')
          ]);
          setFormData(prev => ({
            ...prev,
            dishesString: hyText || "",
            dishesRuString: ruText || ""
          }));
        } else if (primaryLang === 'ru') {
          const [hyText, enText] = await Promise.all([
            translateDishList(text, 'ru', 'hy'),
            translateDishList(text, 'ru', 'en')
          ]);
          setFormData(prev => ({
            ...prev,
            dishesString: hyText || "",
            dishesEnString: enText || ""
          }));
        }
      } catch (err) {
        console.error("Auto-translation failed", err);
      } finally {
        setIsTranslating(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [formData.dishesString, formData.dishesEnString, formData.dishesRuString, primaryLang]);

  // Language script validation helper
  const validateLanguageScript = (langKey: LangKey, text: string): string | null => {
    if (!text || !text.trim()) return null;

    if (langKey === 'hy') {
      const hasLatin = /[a-zA-Z]/.test(text);
      const hasCyrillic = /[\u0400-\u04FF]/.test(text);
      if (hasLatin || hasCyrillic) {
        return "Տառերը չեն համապատասխանում հայերենին (օգտագործեք հայերեն տառեր)";
      }
    } else if (langKey === 'en') {
      const hasArmenian = /[\u0530-\u058F]/.test(text);
      const hasCyrillic = /[\u0400-\u04FF]/.test(text);
      if (hasArmenian || hasCyrillic) {
        return "Տառերը չեն համապատասխանում անգլերենին (օգտագործեք անգլերեն/լատինատառ)";
      }
    } else if (langKey === 'ru') {
      const hasArmenian = /[\u0530-\u058F]/.test(text);
      const hasLatin = /[a-zA-Z]/.test(text);
      if (hasArmenian || hasLatin) {
        return "Տառերը չեն համապատասխանում ռուսերենին (օգտագործեք ռուսերեն/կիրիլիցա տառեր)";
      }
    }
    return null;
  };

  const [businessId, setBusinessId] = useState<string | null>(null);
  const [locations, setLocations] = useState<any[]>([]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
      if (!token) {
        setLoading(false);
        return;
      }
      const h = { headers: { Authorization: `Bearer ${token}` } };

      let bId = businessId || (currentUser as any)?.businessId || (currentUser as any)?.business?._id;
      if (!bId) {
        const bizRes = await axios.get(`${getApiUrl()}/businesses/me/all`, h);
        bId = bizRes.data?.data?.[0]?._id;
      }

      if (bId) {
        setBusinessId(bId);
        // Fetch locations for dropdown
        const locRes = await axios.get(`${getApiUrl()}/businesses/${bId}/locations`);
        setLocations(locRes.data.data || []);

        // Fetch offers
        const res = await axios.get(`${getApiUrl()}/offers/business/${bId}`);
        setOffers(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch offers", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;

    try {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
      const payload = {
        businessId,
        packageName: formData.packageName,
        pax: formData.pax,
        price: formData.price,
        location: formData.location,
        atmosphere: formData.atmosphere,
        dishes: formData.dishesString.split(',').map(s => s.trim()).filter(Boolean),
        dishesEn: formData.dishesEnString.split(',').map(s => s.trim()).filter(Boolean),
        dishesRu: formData.dishesRuString.split(',').map(s => s.trim()).filter(Boolean),
        inclusions: hasInclusions ? formData.inclusionsString.split(',').map(s => s.trim()).filter(Boolean) : []
      };

      if (editingId) {
        await axios.put(`${getApiUrl()}/offers/${editingId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(`${getApiUrl()}/offers`, payload, { headers: { Authorization: `Bearer ${token}` } });
      }

      setIsModalOpen(false);
      fetchOffers();
    } catch (err: any) {
      console.error("Failed to save offer", err.response?.data || err.message);
      alert(err.response?.data?.error || "Failed to save offer");
    }
  };

  const executeDelete = async (id: string) => {
    try {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
      await axios.delete(`${getApiUrl()}/offers/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchOffers();
    } catch (err) {
      console.error("Failed to delete offer", err);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
  };

  const openAddModal = () => {
    setEditingId(null);
    setHasInclusions(false);
    previousPrimaryText.current = "";
    setPrimaryLang('hy');
    setShowTranslations(false);
    setFormData({
      packageName: "",
      pax: 1,
      price: 0,
      location: locations.length > 0 ? locations[0].address : "",
      atmosphere: "family",
      dishesString: "",
      dishesEnString: "",
      dishesRuString: "",
      inclusionsString: ""
    });
    setIsModalOpen(true);
  };

  const openEditModal = (offer: Offer) => {
    setEditingId(offer._id);
    const hasInc = Boolean(offer.inclusions && offer.inclusions.length > 0);
    setHasInclusions(hasInc);
    const dishesArm = Array.isArray(offer.dishes) ? offer.dishes.join(", ") : "";
    previousPrimaryText.current = dishesArm;
    setShowTranslations(false);
    setFormData({
      packageName: offer.packageName || "",
      pax: offer.pax || 1,
      price: offer.price || 0,
      location: offer.location || (locations.length > 0 ? locations[0].address : ""),
      atmosphere: offer.atmosphere || "family",
      dishesString: dishesArm,
      dishesEnString: Array.isArray(offer.dishesEn) ? offer.dishesEn.join(", ") : "",
      dishesRuString: Array.isArray(offer.dishesRu) ? offer.dishesRu.join(", ") : "",
      inclusionsString: Array.isArray(offer.inclusions) ? offer.inclusions.join(", ") : ""
    });
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[hsl(var(--primary))] border-t-transparent"></div>
      </div>
    );
  }

  const isStarterPlan = !activePlan || activePlan === "start" || activePlan === "starter" || activePlan === "free" || activePlan === "basic";

  if (isStarterPlan) {
    return (
      <div className="p-6 max-w-lg mx-auto mt-12">
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-3xl p-8 text-center shadow-xl">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-500 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[hsl(var(--foreground))] mb-2">{offersT.lockedTitle || "Menus & Offers Feature Locked"}</h2>
          <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] mb-6 leading-relaxed">
            {offersT.lockedDesc || "The Menus & Offers feature is not available on the Start plan. Upgrade your plan to Pro or Premium to manage packages and menus."}
          </p>
          <Link href="/dashboard/settings" className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm transition-all inline-block shadow-lg shadow-emerald-500/20 hover:scale-105">
            {offersT.upgradeBtn || "Upgrade Plan"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{offersT.pageTitle || "Menus & Offers"}</h2>
          <p className="text-[hsl(var(--muted-foreground))]">{offersT.pageSub || "Manage dining packages, set menus, and special banquet offers for AI search."}</p>
        </div>
        <button
          onClick={openAddModal}
          className="btn-primary py-2 px-4 rounded-xl flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium cursor-pointer"
        >
          <Plus className="h-4 w-4" /> {offersT.addPackage || "Add Package"}
        </button>
      </div>

      {offers.length === 0 ? (
        <div className="rounded-2xl border border-[hsl(var(--border))] border-dashed p-12 text-center bg-[hsl(var(--muted))]/20">
          <Utensils className="mx-auto h-10 w-10 text-[hsl(var(--muted-foreground))] mb-4" />
          <h3 className="text-lg font-semibold mb-2">{offersT.emptyTitle || "No packages yet"}</h3>
          <p className="text-[hsl(var(--muted-foreground))] max-w-sm mx-auto mb-6">
            {offersT.emptySub || "Add your dining packages and menus to make them searchable by the AI assistant."}
          </p>
          <button onClick={openAddModal} className="btn-primary py-2 px-4 rounded-xl inline-flex items-center gap-2 cursor-pointer">
            <Plus className="h-4 w-4" /> {offersT.addFirstPackage || "Add Your First Package"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {offers.map((offer) => (
            <div key={offer._id} className="relative group rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm transition-all hover:border-[hsl(var(--primary))]/30 hover:shadow-md">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-lg">{offer.packageName}</h3>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(offer)}
                    title={offersT.editModalTitle || "Edit"}
                    className="text-amber-500 hover:text-amber-700 p-1 bg-amber-50 hover:bg-amber-100 rounded cursor-pointer transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(offer._id)}
                    title={offersT.deleteConfirmBtn || "Delete"}
                    className="text-red-500 hover:text-red-700 p-1 bg-red-50 hover:bg-red-100 rounded cursor-pointer transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 text-sm text-[hsl(var(--muted-foreground))]">
                {/* Price, Pax & Atmosphere Header Badges */}
                <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20 text-xs shadow-2xs">
                      <Tag className="h-3.5 w-3.5 text-emerald-500" /> 
                      <span>{offer.price.toLocaleString()} AMD</span>
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] font-semibold text-xs border border-[hsl(var(--border))]">
                      <Users className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
                      <span>{offer.pax} {offer.pax === 1 ? (offersT.person || "Person") : (offersT.persons || "Persons")}</span>
                    </div>
                  </div>

                  {/* Atmosphere Badge */}
                  {offer.atmosphere && (
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-xl flex items-center gap-1.5 border shadow-2xs backdrop-blur-xs transition-all ${
                      offer.atmosphere === 'family' 
                        ? 'bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300' 
                        : offer.atmosphere === 'friends' 
                        ? 'bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/15 border-indigo-500/30 text-indigo-700 dark:text-indigo-300' 
                        : 'bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                    }`}>
                      <Sparkles className="w-3 h-3 shrink-0" />
                      <span>
                        {offer.atmosphere === 'family' 
                          ? `👨‍👩‍👧‍👦 ${offersT.atmosphereFamily || 'Ընտանեկան'}` 
                          : offer.atmosphere === 'friends' 
                          ? `👥 ${offersT.atmosphereFriends || 'Ընկերական'}` 
                          : `⚡ ${offersT.atmosphereActive || 'Ակտիվ'}`}
                      </span>
                    </span>
                  )}
                </div>

                {/* Styled Location Badge */}
                <div className="flex items-center gap-2 text-xs bg-[hsl(var(--muted))]/40 border border-[hsl(var(--border))]/80 px-3 py-2 rounded-xl transition-all hover:bg-[hsl(var(--muted))]/70 group cursor-default" title={offer.location}>
                  <div className="p-1 rounded-lg bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] shrink-0 group-hover:scale-110 transition-transform">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <span className="truncate font-semibold text-[hsl(var(--foreground))] text-xs">
                    {offer.location}
                  </span>
                </div>
                
                {/* Dishes Summary */}
                <div className="mt-3 pt-3 border-t border-[hsl(var(--border))]/60 space-y-1.5">
                  <p className="font-bold text-[hsl(var(--foreground))] text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
                    <Utensils className="w-3 h-3 text-[hsl(var(--primary))]" />
                    <span>{offersT.dishesHeading || "Dishes"}</span>
                  </p>
                  <p className="line-clamp-2 text-xs font-medium text-[hsl(var(--foreground))] bg-[hsl(var(--muted))]/20 p-2 rounded-lg border border-[hsl(var(--border))]/40">
                    🇦🇲 {offer.dishes.join(', ')}
                  </p>
                  {offer.dishesEn && offer.dishesEn.length > 0 && (
                    <p className="line-clamp-2 text-xs text-[hsl(var(--muted-foreground))] pl-1">
                      🇬🇧 {offer.dishesEn.join(', ')}
                    </p>
                  )}
                  {offer.dishesRu && offer.dishesRu.length > 0 && (
                    <p className="line-clamp-2 text-xs text-[hsl(var(--muted-foreground))] pl-1">
                      🇷🇺 {offer.dishesRu.join(', ')}
                    </p>
                  )}
                </div>
                
                {offer.inclusions && offer.inclusions.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-[hsl(var(--border))]/40">
                    <p className="font-bold text-[hsl(var(--foreground))] mb-1 text-[11px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">{offersT.inclusionsLabel || "Inclusions"}</p>
                    <p className="line-clamp-2 text-xs">{offer.inclusions.join(', ')}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col animate-scale-in">
            <div className="px-6 py-4 border-b border-[hsl(var(--border))] flex justify-between items-center bg-[hsl(var(--muted))]/30">
              <h3 className="text-lg font-semibold">{editingId ? (offersT.editModalTitle || "Edit Package") : (offersT.createModalTitle || "Create Package")}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] text-2xl leading-none cursor-pointer">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form id="offerForm" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{offersT.packageNameLabel || "Package Name"}</label>
                    <input
                      required
                      type="text"
                      placeholder={offersT.packageNamePlaceholder || "e.g. Silver Banquet"}
                      value={formData.packageName}
                      onChange={e => setFormData({ ...formData, packageName: e.target.value })}
                      className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm outline-none focus:border-[hsl(var(--primary))] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{offersT.paxLabel || "Number of People (Pax)"}</label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={formData.pax}
                      onChange={e => setFormData({ ...formData, pax: e.target.value === '' ? '' : parseInt(e.target.value) || '' })}
                      className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm outline-none focus:border-[hsl(var(--primary))] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{offersT.priceLabel || "Total Price (AMD)"}</label>
                    <input
                      required
                      type="number"
                      min="0"
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: e.target.value === '' ? '' : parseInt(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm outline-none focus:border-[hsl(var(--primary))] transition-colors"
                    />
                  </div>
                  {/* CUSTOM LOCATION DROPDOWN */}
                  <div className="relative" ref={locationRef}>
                    <label className="block text-sm font-medium mb-1">{offersT.locationLabel || "Location"}</label>
                    {locations.length > 0 ? (
                      <>
                        <button
                          type="button"
                          onClick={() => { setIsLocationOpen(!isLocationOpen); setIsAtmosphereOpen(false); }}
                          className="w-full flex items-center justify-between rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm outline-none focus:border-[hsl(var(--primary))] transition-all cursor-pointer select-none font-medium shadow-2xs hover:bg-[hsl(var(--muted))]/30"
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            <MapPin className="w-4 h-4 text-[hsl(var(--primary))] shrink-0" />
                            <span className="truncate font-semibold text-[hsl(var(--foreground))] text-xs sm:text-sm">
                              {formData.location || (offersT.selectLocationPlaceholder || "Select a location...")}
                            </span>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-[hsl(var(--muted-foreground))] shrink-0 transition-transform duration-200 ${isLocationOpen ? 'rotate-180 text-[hsl(var(--primary))]' : ''}`} />
                        </button>

                        {isLocationOpen && (
                          <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl shadow-2xl p-1.5 animate-scale-in space-y-1 max-h-60 overflow-y-auto backdrop-blur-md">
                            {locations.map((loc) => {
                              const isSelected = formData.location === loc.address;
                              return (
                                <button
                                  key={loc._id}
                                  type="button"
                                  onClick={() => {
                                    setFormData({ ...formData, location: loc.address });
                                    setIsLocationOpen(false);
                                  }}
                                  className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left cursor-pointer ${
                                    isSelected 
                                      ? 'bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/30 text-[hsl(var(--primary))] font-bold shadow-2xs' 
                                      : 'hover:bg-[hsl(var(--muted))]/50 text-[hsl(var(--foreground))] border border-transparent'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 truncate pr-2">
                                    <div className="p-1.5 rounded-lg bg-[hsl(var(--muted))]/60 text-[hsl(var(--primary))] shrink-0">
                                      <MapPin className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="text-xs sm:text-sm font-medium truncate">{loc.address}</span>
                                  </div>
                                  {isSelected && <Check className="w-4 h-4 text-[hsl(var(--primary))] shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </>
                    ) : (
                      <input
                        required
                        type="text"
                        placeholder="Exact Address"
                        value={formData.location}
                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                        className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm outline-none focus:border-[hsl(var(--primary))] transition-colors"
                      />
                    )}
                  </div>

                  {/* CUSTOM ATMOSPHERE DROPDOWN */}
                  <div className="relative" ref={atmosphereRef}>
                    <label className="block text-sm font-medium mb-1">{offersT.atmosphereLabel || "Միջավայր"}</label>
                    <button
                      type="button"
                      onClick={() => { setIsAtmosphereOpen(!isAtmosphereOpen); setIsLocationOpen(false); }}
                      className="w-full flex items-center justify-between rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm outline-none focus:border-[hsl(var(--primary))] transition-all cursor-pointer select-none font-medium shadow-2xs hover:bg-[hsl(var(--muted))]/30"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-base">
                          {formData.atmosphere === 'family' ? '👨‍👩‍👧‍👦' : formData.atmosphere === 'friends' ? '👥' : '⚡'}
                        </span>
                        <span className="font-semibold text-[hsl(var(--foreground))] text-xs sm:text-sm">
                          {formData.atmosphere === 'family' 
                            ? (offersT.atmosphereFamily || 'Ընտանեկան') 
                            : formData.atmosphere === 'friends' 
                            ? (offersT.atmosphereFriends || 'Ընկերական') 
                            : (offersT.atmosphereActive || 'Ակտիվ')}
                        </span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-[hsl(var(--muted-foreground))] transition-transform duration-200 ${isAtmosphereOpen ? 'rotate-180 text-[hsl(var(--primary))]' : ''}`} />
                    </button>

                    {isAtmosphereOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl shadow-2xl p-1.5 animate-scale-in space-y-1 backdrop-blur-md">
                        {[
                          { id: 'family', icon: '👨‍👩‍👧‍👦', name: offersT.atmosphereFamily || 'Ընտանեկան', desc: offersT.atmosphereFamilyDesc || 'Հարմարավետ, ջերմ և ընտանեկան միջավայր' },
                          { id: 'friends', icon: '👥', name: offersT.atmosphereFriends || 'Ընկերական', desc: offersT.atmosphereFriendsDesc || 'Ջերմ հավաքույթների և ընկերական երեկոների համար' },
                          { id: 'active', icon: '⚡', name: offersT.atmosphereActive || 'Ակտիվ', desc: offersT.atmosphereActiveDesc || 'Ակտիվ, աշխույժ, երաժշտություն և պարեր' },
                        ].map((item) => {
                          const isSelected = formData.atmosphere === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, atmosphere: item.id });
                                setIsAtmosphereOpen(false);
                              }}
                              className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left cursor-pointer ${
                                isSelected 
                                  ? 'bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/30 text-[hsl(var(--primary))] font-bold shadow-2xs' 
                                  : 'hover:bg-[hsl(var(--muted))]/50 text-[hsl(var(--foreground))] border border-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xl p-1.5 rounded-lg bg-[hsl(var(--muted))]/60 shrink-0">{item.icon}</span>
                                <div>
                                  <p className="text-xs sm:text-sm font-semibold">{item.name}</p>
                                  <p className="text-[11px] text-[hsl(var(--muted-foreground))] font-normal">{item.desc}</p>
                                </div>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-[hsl(var(--primary))] shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* DISHES SECTION WITH SELECTABLE PRIMARY LANGUAGE AND COLLAPSIBLE TRANSLATIONS */}
                <div className="space-y-3 pt-3 border-t border-[hsl(var(--border))]/60">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
                    <div>
                      <h4 className="text-sm font-bold flex items-center gap-2 text-[hsl(var(--foreground))]">
                        <Languages className="w-4 h-4 text-[hsl(var(--primary))]" />
                        <span>{offersT.dishesLabel || "Dishes Included"}</span>
                      </h4>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                        {offersT.dishesHelpText || "Մուտքագրեք ուտեստները հիմնական լեզվով (մյուս լեզուները կթարգմանվեն ավտոմատ):"}
                      </p>
                    </div>
                    {isTranslating && (
                      <span className="flex items-center gap-1.5 text-xs text-amber-500 animate-pulse font-semibold bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 self-start sm:self-auto">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        {offersT.translatingText || "Թարգմանվում է..."}
                      </span>
                    )}
                  </div>

                  {/* Primary Language Card - Always visible */}
                  {(['hy', 'en', 'ru'] as LangKey[])
                    .filter(langKey => langKey === primaryLang)
                    .map((langKey) => {
                      let flag = "🇦🇲";
                      let langTitle = "Հայերեն";
                      let placeholderText = "օր․ Խոզի խորոված, Խաչապուրի, Գինի";
                      let value = formData.dishesString;
                      let borderAccent = "border-blue-500 dark:border-blue-400";

                      if (langKey === 'en') {
                        flag = "🇬🇧";
                        langTitle = "English / Անգլերեն";
                        placeholderText = "e.g. Pork Khorovats, Khachapuri, Wine";
                        value = formData.dishesEnString;
                        borderAccent = "border-emerald-500 dark:border-emerald-400";
                      } else if (langKey === 'ru') {
                        flag = "🇷🇺";
                        langTitle = "Russian / Ռուսերեն";
                        placeholderText = "напр. Шашлык из свинины, Хачапури, Вино";
                        value = formData.dishesRuString;
                        borderAccent = "border-purple-500 dark:border-purple-400";
                      }

                      const scriptError = validateLanguageScript(langKey, value);

                      return (
                        <div
                          key={langKey}
                          className={`relative rounded-xl border-2 p-3.5 bg-[hsl(var(--card))] ${borderAccent} shadow-md bg-[hsl(var(--background))]/60`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <label className="text-xs font-bold flex items-center gap-2 select-none">
                                <span>{flag} {langTitle}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/30">
                                  {offersT.primaryBadge || "⭐ Հիմնական (Primary)"}
                                </span>
                              </label>
                            </div>
                          </div>

                          <textarea
                            required
                            rows={3}
                            value={value}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (langKey === 'hy') setFormData({ ...formData, dishesString: val });
                              else if (langKey === 'en') setFormData({ ...formData, dishesEnString: val });
                              else if (langKey === 'ru') setFormData({ ...formData, dishesRuString: val });
                            }}
                            placeholder={placeholderText}
                            className={`w-full rounded-xl border bg-[hsl(var(--background))] px-3.5 py-2.5 text-sm outline-none transition-colors resize-none ${
                              scriptError 
                                ? "border-red-500 focus:border-red-600 bg-red-500/5 text-red-900 dark:text-red-200" 
                                : "border-[hsl(var(--border))] focus:border-[hsl(var(--primary))]"
                            }`}
                          />

                          {scriptError && (
                            <div className="flex items-center gap-1.5 text-[11px] text-red-500 dark:text-red-400 font-medium pt-1.5 animate-fade-in">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>{scriptError}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}

                  {/* Toggle button to show/hide non-primary translations */}
                  <button
                    type="button"
                    onClick={() => setShowTranslations(!showTranslations)}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 hover:bg-[hsl(var(--muted))]/60 text-xs font-semibold transition-all cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-[hsl(var(--primary))]" />
                      <span>{offersT.otherLangTranslations || "Այլ լեզուների թարգմանություններ"} (🇬🇧 English & 🇷🇺 Русский)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                        {offersT.autoTranslatedBadge || "Auto-translated"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[hsl(var(--muted-foreground))]">
                      <span>{showTranslations ? (offersT.hideText || "Թաքցնել") : (offersT.showText || "Տեսնել")}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showTranslations ? "rotate-180" : ""}`} />
                    </div>
                  </button>

                  {/* Collapsible non-primary language cards */}
                  {showTranslations && (
                    <div className="space-y-3 animate-fade-in pt-1">
                      {(['hy', 'en', 'ru'] as LangKey[])
                        .filter(langKey => langKey !== primaryLang)
                        .map((langKey) => {
                          let flag = "";
                          let langTitle = "";
                          let placeholderText = "";
                          let value = "";
                          let borderAccent = "";

                          if (langKey === 'hy') {
                            flag = "🇦🇲";
                            langTitle = "Հայերեն";
                            placeholderText = "օր․ Խոզի խորոված, Խաչապուրի, Գինի";
                            value = formData.dishesString;
                            borderAccent = "border-blue-500/20 hover:border-blue-500/40";
                          } else if (langKey === 'en') {
                            flag = "🇬🇧";
                            langTitle = "English / Անգլերեն";
                            placeholderText = "e.g. Pork Khorovats, Khachapuri, Wine";
                            value = formData.dishesEnString;
                            borderAccent = "border-emerald-500/20 hover:border-emerald-500/40";
                          } else {
                            flag = "🇷🇺";
                            langTitle = "Russian / Ռուսերեն";
                            placeholderText = "напр. Шашлык из свинины, Хачапури, Вино";
                            value = formData.dishesRuString;
                            borderAccent = "border-purple-500/20 hover:border-purple-500/40";
                          }

                          const scriptError = validateLanguageScript(langKey, value);

                          return (
                            <div
                              key={langKey}
                              className={`relative rounded-xl border-2 p-3.5 transition-all duration-200 bg-[hsl(var(--card))] ${borderAccent}`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <label className="text-xs font-bold flex items-center gap-2 select-none">
                                    <span>{flag} {langTitle}</span>
                                  </label>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setPrimaryLang(langKey)}
                                  className="text-[11px] px-2.5 py-1 rounded-full font-semibold transition-all cursor-pointer bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/80 hover:text-[hsl(var(--foreground))]"
                                >
                                  {offersT.setAsPrimaryBtn || "◯ Ընտրել որպես հիմնական"}
                                </button>
                              </div>

                              <textarea
                                rows={2}
                                value={value}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (langKey === 'hy') setFormData({ ...formData, dishesString: val });
                                  else if (langKey === 'en') setFormData({ ...formData, dishesEnString: val });
                                  else if (langKey === 'ru') setFormData({ ...formData, dishesRuString: val });
                                }}
                                placeholder={placeholderText}
                                className={`w-full rounded-xl border bg-[hsl(var(--background))] px-3.5 py-2 text-xs outline-none transition-colors resize-none ${
                                  scriptError 
                                    ? "border-red-500 focus:border-red-600 bg-red-500/5 text-red-900 dark:text-red-200" 
                                    : "border-[hsl(var(--border))] focus:border-[hsl(var(--primary))]"
                                }`}
                              />

                              {scriptError && (
                                <div className="flex items-center gap-1.5 text-[11px] text-red-500 dark:text-red-400 font-medium pt-1.5 animate-fade-in">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>{scriptError}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[hsl(var(--border))]/60">
                  <div 
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
                      hasInclusions 
                        ? "border-[#00e676]/40 bg-[#00e676]/5 shadow-sm" 
                        : "border-[hsl(var(--border))] bg-[hsl(var(--background))] hover:border-[hsl(var(--border))]/80"
                    }`}
                    onClick={() => setHasInclusions(!hasInclusions)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative inline-flex items-center">
                        <input
                          type="checkbox"
                          id="hasInclusionsCheckbox"
                          checked={hasInclusions}
                          onChange={(e) => setHasInclusions(e.target.checked)}
                          onClick={(e) => e.stopPropagation()}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700/80 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#00e676]/40 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-slate-300 dark:after:border-slate-600 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:bg-[#00e676] peer-checked:after:border-[#00e676] peer-checked:after:shadow-[0_0_8px_#00e676] peer-checked:bg-[#00e676]/20 peer-checked:border peer-checked:border-[#00e676]/40 shadow-inner transition-all"></div>
                      </div>
                      <label htmlFor="hasInclusionsCheckbox" className="text-sm font-semibold text-[hsl(var(--foreground))] cursor-pointer select-none">
                        {offersT.inclusionsLabel || "Additional Inclusions"}
                      </label>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                      hasInclusions 
                        ? "bg-[#00e676]/15 text-[#00e676]" 
                        : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
                    }`}>
                      {hasInclusions ? (offersT.enabled || "Enabled") : (offersT.optional || "Optional")}
                    </span>
                  </div>

                  {hasInclusions && (
                    <div className="mt-3 space-y-1.5 animate-fade-in pl-6">
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1.5">
                        {offersT.inclusionsHelp || "Separate with commas (e.g. Live Music, Waiter Service, Decoration)"}
                      </p>
                      <textarea
                        rows={2}
                        placeholder={offersT.inclusionsPlaceholder || "e.g. Live Music, Waiter Service"}
                        value={formData.inclusionsString}
                        onChange={e => setFormData({ ...formData, inclusionsString: e.target.value })}
                        className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm outline-none focus:border-[hsl(var(--primary))] transition-colors resize-none"
                      />
                    </div>
                  )}
                </div>
              </form>
            </div>
            <div className="px-6 py-4 border-t border-[hsl(var(--border))] flex justify-end gap-3 bg-[hsl(var(--muted))]/30">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] cursor-pointer"
              >
                {offersT.cancel || "Cancel"}
              </button>
              <button
                type="submit"
                form="offerForm"
                className="btn-primary py-2 px-6 rounded-xl text-sm font-medium shadow-sm cursor-pointer"
              >
                {editingId ? (offersT.saveChanges || "Save Changes") : (offersT.createBtn || "Create Package")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-scale-in text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[hsl(var(--foreground))]">{offersT.deleteTitle || "Delete Package?"}</h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1.5 leading-relaxed">
                {offersT.deleteDesc || "Are you sure you want to delete this offer? This action cannot be undone."}
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-[hsl(var(--border))] text-xs font-semibold hover:bg-[hsl(var(--muted))] transition-colors cursor-pointer"
              >
                {offersT.cancel || "Cancel"}
              </button>
              <button
                onClick={() => {
                  const id = deleteTargetId;
                  setDeleteTargetId(null);
                  if (id) executeDelete(id);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold shadow-md shadow-red-500/20 transition-all cursor-pointer"
              >
                {offersT.deleteConfirmBtn || "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
