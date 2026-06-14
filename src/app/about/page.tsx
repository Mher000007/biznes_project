import type { Metadata } from "next";
import Link from "next/link";
import styles from "./About.module.scss";

export const metadata: Metadata = {
  title: "About Findy — Armenia's HoReCa Platform",
  description:
    "Findy-ն Հայաuտանի առաջին մasnagiтacvatz hartaky e, vory miavorom e HoReCa volorti bolor biznesnery mek teghum.",
};

const STATS = [
  { value: "900+", label: "Registered businesses" },
  { value: "HoReCa", label: "Specialized sector" },
  { value: "3", label: "Subscription plans" },
  { value: "24/7", label: "Platform availability" },
];

const USER_FEATURES = [
  {
    icon: "🔍",
    bg: "hsla(220,85%,60%,0.12)",
    title: "Հեշտ Որոնում",
    desc: "Գտեք ձեր մոտակա սրճARanny, ռեստورANը կام հیوРАНОЦЫ Vajrkyanनeri yntacqum.",
  },
  {
    icon: "📅",
    bg: "hsla(145,65%,45%,0.12)",
    title: "ՈւղղAki Amragroupm",
    desc: "КаТАРЕЛ amragroupm ugghakioren hartakits, аranc havayelyal kaylyeri.",
  },
  {
    icon: "🍽️",
    bg: "hsla(30,90%,55%,0.12)",
    title: "Menyu & TsArayutner",
    desc: "Usum nasirel menyon, tsaraуtnery yev gynery naxАbes.",
  },
  {
    icon: "🗺️",
    bg: "hsla(260,75%,60%,0.12)",
    title: "Qartez & Koghmnoroutyun",
    desc: "Коghmnorvel interaktiv karteji midzov, yst dzez gtanvelu vayrits.",
  },
  {
    icon: "⭐",
    bg: "hsla(45,95%,55%,0.12)",
    title: "Kardziknер & Varkaniш",
    desc: "Кардацek iravakan hachakhortneri ardzaganqnery yev yntrel vstaheli.",
  },
  {
    icon: "✅",
    bg: "hsla(165,65%,45%,0.12)",
    title: "Verified Biznesner",
    desc: "Bolor kazmakerpoutyunnery ancnum en stugman fazit, vorakutyun apahoverumu hamar.",
  },
];

const BIZ_BENEFITS = [
  {
    title: "Ынтлaynecrek hachakhortneri bazany",
    desc: "Biznesneri hamar Findy-ն htaroroutyoun e yndlaynecnel hachakhortneri bazany.",
  },
  {
    title: "Кaravelek amragroupnery",
    desc: "Staceq amragroupmayin haytеr anmidjavorapen hartakits yev heteveq dranq.",
  },
  {
    title: "Aveli tesaneli egheq",
    desc: "Avlyacreq dzer biznesy Premium & Pro plannerov chisht lisarany arajev.",
  },
  {
    title: "Analitika & Vijаkаgrouptyoun",
    desc: "Heteveq moutkerin, amragroupnerin u kartziknerin dzer dashboard-its.",
  },
];

const MOCK_CARDS = [
  { icon: "🍕", title: "Lavash Restaurant", sub: "★ 4.9 · Yerevan", color: "hsla(20,90%,55%,0.12)" },
  { icon: "☕", title: "Cascade Lounge", sub: "★ 4.7 · Yerevan", color: "hsla(210,80%,55%,0.12)" },
  { icon: "🏨", title: "Dilijan Resort", sub: "★ 4.9 · Dilijan", color: "hsla(145,65%,45%,0.12)" },
  { icon: "🍷", title: "Dolmama", sub: "★ 4.8 · Yerevan", color: "hsla(330,70%,55%,0.12)" },
];

export default function AboutPage() {
  return (
    <div className={styles.aboutPage}>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroBg} aria-hidden />

        <div className={styles.heroBadge}>
          <span className={styles.heroBadgeDot} />
          Armenia&apos;s #1 HoReCa Platform
        </div>

        <h1 className={styles.heroTitle}>
          <span className={styles.heroTitleAccent}>Findy</span>
          <br />
          Գտի&apos;ր Ճիshт Тeghы, Ճиshт Пahun
        </h1>

        <p className={styles.heroTagline}>
          Hayastani arajin masnagiтacvatz hartaky e, vory miavorom e
          HoReCa volorti bolor biznesnery mek teghum.
        </p>

        <Link href="/discover" className={styles.heroCta}>
          Discover Businesses →
        </Link>
      </section>

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
            <p className={styles.storyLabel}>Mer masin</p>
            <h2 className={styles.storyTitle}>
              Inch&apos;e<br />Findy-ն?
            </h2>
            <p className={styles.storyText}>
              Findy-ն Hayastani arajin{" "}
              <strong>masnagiтacvatz hartaky</strong> e, vory miavorom e HoReCa
              volorti bolor biznesnery (hyuranoтsner, restauranner,
              srтsharanner) mek teghum.
            </p>
            <p className={styles.storyText}>
              Menq stexel enq hartats, vortel karokhiq eq heshtutyan
              gtel dzez motaka srtsharany, restoranы kam hyuranotsы,
              katarel amragroupm ugghakioren kajtqits, usum nasirel
              menyun, tsarayutnery yev gynery, yev koghmnorvel karteji
              midzov, yst dzez gtanvelu vayrits.
            </p>
            <p className={styles.storyText}>
              Biznesneri hamar Findy-ն hntaroutyoun e yntlaynecnel
              hachakhortneri bazany, karaverel amragroupnery yev aveli
              tesaneli linel chisht lisarany hamar.
            </p>
          </div>

          <div className={styles.storyVisual}>
            <div className={styles.storyVisualInner}>
              {MOCK_CARDS.map((c) => (
                <div key={c.title} className={styles.miniCard}>
                  <div className={styles.miniCardIcon} style={{ background: c.color }}>
                    {c.icon}
                  </div>
                  <div className={styles.miniCardTitle}>{c.title}</div>
                  <div className={styles.miniCardSub}>{c.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className={styles.divider} />

      {/* ── User features ─────────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionChip}>Dzer hamar</span>
          <h2 className={styles.sectionTitle}>Inch kstanaq Findy-its</h2>
          <p className={styles.sectionSub}>
            Amboghjoutyamb mecel enq hntavoroutyoun, vorby karokhiq eq
            heshtutyan gordzadrel HoReCa volorty.
          </p>
        </div>

        <div className={styles.featuresGrid}>
          {USER_FEATURES.map((f) => (
            <div key={f.title} className={styles.featureCard}>
              <div className={styles.featureIconWrap} style={{ background: f.bg }}>
                <span style={{ fontSize: "1.25rem" }}>{f.icon}</span>
              </div>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className={styles.divider} />

      {/* ── Business benefits ─────────────────────────────────────── */}
      <section className={styles.sectionNarrow}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionChip}>Biznesneri hamar</span>
          <h2 className={styles.sectionTitle}>Inchpes Findy-ն ognoum e dzer biznesy</h2>
          <p className={styles.sectionSub}>
            Findy-ն biznesneri hamar hntavoroutyoun e yntlaynecnel
            hachakhortneri bazany, karaverel amragroupnery yev aveli
            tesaneli linel chisht lisarany hamar.
          </p>
        </div>

        <div className={styles.benefitsWrap}>
          <div className={styles.benefitsGrid}>
            {BIZ_BENEFITS.map((b, i) => (
              <div key={b.title} className={styles.benefitItem}>
                <span className={styles.benefitNum}>0{i + 1}</span>
                <div className={styles.benefitContent}>
                  <h3 className={styles.benefitTitle}>{b.title}</h3>
                  <p className={styles.benefitDesc}>{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission / CTA Banner ──────────────────────────────────── */}
      <div className={styles.missionBanner}>
        <div className={styles.missionBannerBg} aria-hidden />

        <p className={styles.missionQuote}>
          &ldquo;Findy &mdash; Gtir Chisht Teghy,{" "}
          <span className={styles.missionQuoteAccent}>Chisht Pahin</span>
          &rdquo;
        </p>

        <p className={styles.missionSub}>
          Miavoretsir HoReCa volorty Hayastanum: Gtir kez motor
          srtsharany, restoranы kam hyuranotsы ugghakioren kajtqits.
        </p>

        <div className={styles.missionButtons}>
          <Link href="/discover" className={styles.missionBtnPrimary}>
            🔍 Discover businesses
          </Link>
          <Link href="/register" className={styles.missionBtnSecondary}>
            ➕ Add your business
          </Link>
        </div>
      </div>

    </div>
  );
}
