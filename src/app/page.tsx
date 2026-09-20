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
      canonical: "https://treeo.am",
      languages: {
        en: "https://treeo.am/en",
        hy: "https://treeo.am/hy",
        ru: "https://treeo.am/ru",
        "x-default": "https://treeo.am",
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
