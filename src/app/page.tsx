import HeroSection from "@/components/landing/HeroSection";
import HeroCarousel from "@/components/landing/HeroCarousel";
import CategoriesGrid from "@/components/landing/CategoriesGrid";
import FeaturedBusinesses from "@/components/landing/FeaturedBusinesses";
import StatsSection from "@/components/landing/StatsSection";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <HeroCarousel />
      <CategoriesGrid />
      <FeaturedBusinesses />
      <StatsSection />
    </>
  );
}
