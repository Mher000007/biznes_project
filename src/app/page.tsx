import StoriesSection from "@/components/landing/StoriesSection";
import HeroSection from "@/components/landing/HeroSection";
import InstagramReviewFeed from "@/components/landing/InstagramReviewFeed";
import FeaturedBusinesses from "@/components/landing/FeaturedBusinesses";
import StatsSection from "@/components/landing/StatsSection";

import PremiumLogoSlider from "@/components/landing/PremiumLogoSlider";

import type { Metadata } from "next";
import { getTranslations } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t.seo.homeTitle,
    description: t.seo.homeDesc,
    alternates: {
      canonical: "https://findy.am",
      languages: {
        en: "https://findy.am/en",
        hy: "https://findy.am/hy",
        ru: "https://findy.am/ru",
        "x-default": "https://findy.am",
      },
    },
  };
}

export default function HomePage() {
  return (
    <div className="homepage-wrapper">
      <HeroSection />
      <StoriesSection />
      <div className="homepage-grid">
        <PremiumLogoSlider />
        <FeaturedBusinesses />
        <InstagramReviewFeed />
        {/* <StatsSection /> */}
      </div>
    </div>
  );
}
