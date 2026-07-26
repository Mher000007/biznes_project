"use client";
import Link from "next/link";
import styles from "./About.module.scss";
import { useI18n } from "@/i18n";
import { useEffect, useState } from "react";
import { getApiUrl } from "@/lib/utils";

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
  const { t } = useI18n();
  const [businessCount, setBusinessCount] = useState<string>("...");

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

      {/* ── Business benefits ─────────────────────────────────────── */}
      <section className={styles.sectionNarrow}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionChip}>{t.about.bizBenefits.chip}</span>
          <h2 className={styles.sectionTitle}>{t.about.bizBenefits.title}</h2>
          <p className={styles.sectionSub}>
            {t.about.bizBenefits.sub}
          </p>
        </div>

        <div className={styles.benefitsWrap}>
          <div className={styles.benefitsGrid}>
            {t.about.bizBenefits.items.map((b, i) => (
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

    </div>
  );
}
