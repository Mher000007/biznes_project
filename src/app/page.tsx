import StoriesSection from "@/components/landing/StoriesSection";
import HeroSection from "@/components/landing/HeroSection";
import InstagramReviewFeed from "@/components/landing/InstagramReviewFeed";
import FeaturedBusinesses from "@/components/landing/FeaturedBusinesses";
import StatsSection from "@/components/landing/StatsSection";

export default function HomePage() {
  return (
    <div className="homepage-wrapper">
      <HeroSection />
      <StoriesSection />
      <div className="homepage-grid">
        <InstagramReviewFeed />
        <FeaturedBusinesses />
        {/* <StatsSection /> */}
      </div>
    </div>
  );
}
