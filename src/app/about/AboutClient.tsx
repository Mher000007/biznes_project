"use client";
import Link from "next/link";
import styles from "./About.module.scss";
import { useI18n } from "@/i18n";
import { useEffect, useState } from "react";
import { getApiUrl } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

const FAQ_DATA = {
  hy: [
    { q: "Ի՞նչ է Findy-ն և ինչպե՞ս է այն աշխատում:", a: "Findy-ն միասնական հարթակ է, որը թույլ է տալիս գտնել և ամրագրել սեղաններ ռեստորաններում, սենյակներ հյուրանոցներում և այլ ծառայություններ HoReCa ոլորտում։" },
    { q: "Արդյոք հավելվածն անվճա՞ր է օգտագործողների համար:", a: "Այո, հարթակում որոնումն ու ամրագրումն անվճար են բոլոր օգտատերերի համար:" },
    { q: "Ինչպե՞ս կարող եմ ամրագրել սեղան կամ ծառայություն:", a: "Պարզապես գտեք ձեզ համապատասխան վայրը, ընտրեք ամսաթիվն ու ժամը և սեղմեք «Ամրագրել»: Ամրագրման հաստատումը կստանաք ակնթարթորեն:" },
    { q: "Կարո՞ղ եմ չեղարկել իմ ամրագրումը:", a: "Այո, ամրագրումները կարելի է չեղարկել ձեր անձնական հաշվի «Իմ ամրագրումները» բաժնից՝ նախապես սահմանված ժամկետներում:" },
    { q: "Ինչպե՞ս կարող եմ ավելացնել իմ բիզնեսը Findy-ում:", a: "Բիզնես գրանցելու համար սեղմեք «Բիզնեսների համար» բաժինը, լրացրեք հայտը և մեր թիմը կկապվի ձեզ հետ՝ ակտիվացման համար:" }
  ],
  en: [
    { q: "What is Findy and how does it work?", a: "Findy is a unified platform that allows you to find and book tables in restaurants, rooms in hotels, and other services in the HoReCa sector." },
    { q: "Is the app free for users?", a: "Yes, searching and booking on the platform is completely free for all our users." },
    { q: "How can I book a table or service?", a: "Simply find the place you like, select the date and time, and click 'Book'. You will receive the booking confirmation instantly." },
    { q: "Can I cancel my booking?", a: "Yes, bookings can be cancelled from the 'My Bookings' section in your personal account within the predefined timeframe." },
    { q: "How can I add my business to Findy?", a: "To register a business, fill out the application on our 'For Businesses' page, and our team will contact you for activation." }
  ],
  ru: [
    { q: "Что такое Findy и как это работает?", a: "Findy — это единая платформа, которая позволяет находить и бронировать столики в ресторанах, номера в отелях и другие услуги в сфере HoReCa." },
    { q: "Бесплатно ли приложение для пользователей?", a: "Да, поиск и бронирование на платформе абсолютно бесплатны для всех наших пользователей." },
    { q: "Как я могу забронировать столик или услугу?", a: "Просто найдите подходящее место, выберите дату и время и нажмите «Забронировать». Вы получите подтверждение бронирования мгновенно." },
    { q: "Могу ли я отменить свое бронирование?", a: "Да, бронирования можно отменить в разделе «Мои бронирования» вашего личного кабинета в заранее установленные сроки." },
    { q: "Как я могу добавить свой бизнес в Findy?", a: "Чтобы зарегистрировать бизнес, заполните заявку на странице «Для бизнеса», и наша команда свяжется с вами для активации." }
  ]
};

const MOCK_CARDS = [
  { icon: "🍕", title: "Lavash Restaurant", sub: "★ 4.9 · Yerevan", color: "hsla(145,65%,45%,0.12)" },
  { icon: "☕", title: "Cascade Lounge", sub: "★ 4.7 · Yerevan", color: "hsla(145,65%,45%,0.12)" },
  { icon: "🏨", title: "Dilijan Resort", sub: "★ 4.9 · Dilijan", color: "hsla(145,65%,45%,0.12)" },
  { icon: "🍷", title: "Dolmama", sub: "★ 4.8 · Yerevan", color: "hsla(145,65%,45%,0.12)" },
];

function formatBusinessCount(count: number): string {
  if (count < 100) return String(count);
  const floor = Math.floor(count / 100) * 100;
  return `${floor}+`;
}

export default function AboutClient() {
  const { t, locale } = useI18n();
  const [businessCount, setBusinessCount] = useState<string>("...");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(prev => prev === index ? null : index);
  };
  
  const faqs = FAQ_DATA[locale as keyof typeof FAQ_DATA] || FAQ_DATA.hy;

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch(`${getApiUrl()}/businesses?limit=1`);
        if (!res.ok) throw new Error("failed");
        const json = await res.json();
        const total: number = json?.pagination?.total_count ?? 0;
        setBusinessCount(formatBusinessCount(total));
      } catch {
        setBusinessCount("100+");
      }
    };
    fetchCount();
  }, []);

  const STATS = [
    { value: businessCount, label: t.about.stats.businesses },
    { value: "HoReCa", label: t.about.stats.sector },
    { value: "24/7", label: t.about.stats.availability },
  ];


  return (
    <div className={styles.aboutPage}>
      {/* ── Stats strip ───────────────────────────────────────────── */}
      <div className={styles.statsStrip}>
        {STATS.map((s) => (
          <div key={s.label} className={styles.statItem}>
            <span className={styles.statValue}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Story ─────────────────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.storyGrid}>
          <div>
            <p className={styles.storyLabel}>{t.about.story.label}</p>
            <h2 className={styles.storyTitle} style={{ whiteSpace: "pre-line" }}>
              {t.about.story.title}
            </h2>
            <p className={styles.storyText}>
              {t.about.story.p1.replace('**', '').replace('**', '') /* simplistic parsing */}
            </p>
            <p className={styles.storyText}>{t.about.story.p2}</p>
            <p className={styles.storyText}>{t.about.story.p3}</p>
          </div>

          <div className={styles.storyVisualInner}>
            {MOCK_CARDS.map((c) => (
              <div key={c.title} className={styles.miniCard}>
                <div className={styles.miniCardIcon} style={{ background: c.color }}>
                  {c.icon}
                </div>
                <div className={styles.miniCardSub}>{c.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className={styles.divider} />

      {/* ── User features ─────────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionChip}>{t.about.userFeatures.chip}</span>
          <h2 className={styles.sectionTitle}>{t.about.userFeatures.title}</h2>
          <p className={styles.sectionSub}>
            {t.about.userFeatures.sub}
          </p>
        </div>

        <div className={styles.featuresGrid}>
          {t.about.userFeatures.items.map((f, i) => {
            const icons = ["🔍", "📅", "🍽️", "🗺️", "⭐", "✅"];
            const bgs = ["hsla(220,85%,60%,0.12)", "hsla(145,65%,45%,0.12)", "hsla(30,90%,55%,0.12)", "hsla(260,75%,60%,0.12)", "hsla(45,95%,55%,0.12)", "hsla(165,65%,45%,0.12)"];
            return (
              <div key={f.title} className={styles.featureCard}>
                <div className={styles.featureIconWrap} style={{ background: bgs[i] }}>
                  <span className={styles.featureIcon}>{icons[i]}</span>
                </div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <div className={styles.divider} />

      {/* ── FAQ ─────────────────────────────────────── */}
      <section id="faq" className={styles.sectionNarrow}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionChip}>FAQ</span>
          <h2 className={styles.sectionTitle}>
            {locale === "hy" ? "Հաճախ տրվող հարցեր" : locale === "ru" ? "Часто задаваемые вопросы" : "Frequently Asked Questions"}
          </h2>
          <p className={styles.sectionSub}>
            {locale === "hy" ? "Գտեք ձեր հարցերի պատասխանները մեր հարթակի վերաբերյալ։" : locale === "ru" ? "Найдите ответы на свои вопросы о нашей платформе." : "Find answers to your questions about our platform."}
          </p>
        </div>

        <div className={styles.faqWrap}>
          <div className={styles.faqList}>
            {faqs.map((faq, i) => (
              <div key={i} className={styles.faqItem}>
                <button 
                  className={styles.faqQuestion} 
                  onClick={() => toggleFaq(i)}
                  aria-expanded={openFaqIndex === i}
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`${styles.faqIcon} ${openFaqIndex === i ? styles.open : ""}`} />
                </button>
                <div className={`${styles.faqAnswerWrap} ${openFaqIndex === i ? styles.open : ""}`}>
                  <div className={styles.faqAnswerInner}>
                    <p className={styles.faqAnswer}>{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
