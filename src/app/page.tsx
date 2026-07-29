import StoriesSection from "@/components/landing/StoriesSection";
import HeroSection from "@/components/landing/HeroSection";
import InstagramReviewFeed from "@/components/landing/InstagramReviewFeed";
import FeaturedBusinesses from "@/components/landing/FeaturedBusinesses";
import StatsSection from "@/components/landing/StatsSection";

import PremiumLogoSlider from "@/components/landing/PremiumLogoSlider";

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
