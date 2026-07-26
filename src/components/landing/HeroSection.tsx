"use client";
import { useState, useEffect, useRef } from "react";
import { Play, Pause } from "lucide-react";
import axios from "axios";
import { getApiUrl } from "@/lib/utils";

interface SlideItem {
  src: string;
  alt: string;
}

const DEFAULT_SLIDES: SlideItem[] = [
  { src: "/carousel/yerevan.png", alt: "Yerevan city center" },
  { src: "/carousel/cafe.png", alt: "Armenian restaurant" },
  { src: "/carousel/market.png", alt: "Armenian market" },
  { src: "/carousel/dilijan.png", alt: "Dilijan resort" },
];

export default function HeroSection() {
  const [slides, setSlides] = useState<SlideItem[]>(DEFAULT_SLIDES);
  const [current, setCurrent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const activeRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      const container = containerRef.current;
      const activeEl = activeRef.current;
      
      const scrollPos = activeEl.offsetTop - (container.clientHeight / 2) + (activeEl.clientHeight / 2);
      
      container.scrollTo({
        top: scrollPos,
        behavior: "smooth"
      });
    }
  }, [current]);

  // Fetch admin-configured hero images first, then fallback to premium businesses
  useEffect(() => {
    const fetchHeroImages = async () => {
      try {
        const API = getApiUrl();
        // Try admin-configured hero images first
        const heroRes = await axios.get(`${API}/hero-images`);
        if (heroRes.data?.success && heroRes.data?.data && heroRes.data.data.length > 0) {
          const loadedSlides = heroRes.data.data.map((url: string, idx: number) => ({
            src: url,
            alt: `Hero image ${idx + 1}`,
          }));
          setSlides(loadedSlides);
          return;
        }

        // Fallback: premium businesses
        const res = await axios.get(`${API}/businesses?premiumOnly=true`);
        if (res.data?.success && res.data?.data && res.data.data.length > 0) {
          const loadedSlides = res.data.data.map((biz: any) => {
            let img = "/carousel/yerevan.png";
            if (biz.metadata?.coverUrl) {
              if (Array.isArray(biz.metadata.coverUrl) && biz.metadata.coverUrl.length > 0) {
                img = biz.metadata.coverUrl[0];
              } else if (typeof biz.metadata.coverUrl === "string") {
                img = biz.metadata.coverUrl;
              }
            } else if (biz.images && biz.images.length > 0) {
              img = biz.images[0];
            } else if (biz.logo) {
              img = biz.logo;
            }
            return { src: img, alt: biz.name };
          });
          setSlides(loadedSlides);
        }
      } catch (err: any) {
        console.log("Failed to load hero images:", err?.message || "Error");
      }
    };
    fetchHeroImages();
  }, []);


  useEffect(() => {
    if (slides.length <= 1 || !isPlaying) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length, current, isPlaying]);

  return (
    <section className="hero-section pt-24 pb-16 sm:pt-32 sm:pb-24 relative overflow-hidden min-h-[500px] sm:min-h-[580px] flex items-center">
      {/* Background Slideshow */}
      <div className="absolute inset-0 z-0">
        {slides.map((slide, i) => (
          <div
            key={`${slide.src}-${i}`}
            className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
            style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}
          >
            <img
              src={slide.src}
              alt={slide.alt}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Dark gradient overlay blending with header */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none z-10" />

      <style>{`
        @keyframes fillDown {
          0% { height: 0%; }
          100% { height: 100%; }
        }
        .hide-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Yelp-style Pagination Indicators (Vertical Left) */}
      <div className="absolute left-6 sm:left-10 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-2.5">
        
        {/* Scrollable Container for Indicators */}
        <div 
          ref={containerRef}
          className="flex flex-col items-center gap-2.5 overflow-y-auto hide-scroll py-2"
          style={{ maxHeight: "35vh", scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {slides.map((_, idx) => (
            <button
              key={idx}
              ref={idx === current ? activeRef : null}
              onClick={() => {
                setCurrent(idx);
                setIsPlaying(true); // Auto-resume when manually selecting
              }}
              className="group flex items-center justify-center bg-transparent border-none px-2 py-1.5 cursor-pointer outline-none"
              aria-label={`Select slide ${idx + 1}`}
            >
              <span
                className={`block w-1.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] relative overflow-hidden ${
                  idx === current
                    ? "h-10 sm:h-12 bg-white/20 opacity-100"
                    : "h-4 sm:h-5 bg-[#EBEBEB] opacity-40 group-hover:opacity-100 group-hover:h-6 group-hover:bg-white"
                }`}
              >
                {idx === current && (
                  <span
                    className="absolute top-0 left-0 w-full bg-white rounded-full"
                    style={{ 
                      animation: "fillDown 5s linear forwards",
                      animationPlayState: isPlaying ? "running" : "paused"
                    }}
                  />
                )}
              </span>
            </button>
          ))}
        </div>

        {/* Play / Pause Toggle */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="group flex items-center justify-center bg-transparent border-none px-2 py-1.5 cursor-pointer outline-none mt-1"
          aria-label={isPlaying ? "Pause slideshow" : "Play slideshow"}
        >
          {isPlaying ? (
            <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#EBEBEB] opacity-40 group-hover:opacity-100 group-hover:text-white transition-all duration-300" />
          ) : (
            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#EBEBEB] opacity-40 group-hover:opacity-100 group-hover:text-white transition-all duration-300 fill-current" />
          )}
        </button>
      </div>
    </section>
  );
}