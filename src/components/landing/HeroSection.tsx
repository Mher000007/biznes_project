"use client";
import { useState, useEffect, useRef } from "react";
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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setSlides((currentSlides) => {
        if (currentSlides.length > 0) {
          setCurrent((p) => (p + 1) % currentSlides.length);
        }
        return currentSlides;
      });
    }, 5000);
  };

  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Fetch premium businesses to display dynamic slideshow backgrounds, or fallback
  useEffect(() => {
    const fetchPremium = async () => {
      try {
        const API = getApiUrl();
        const res = await axios.get(`${API}/businesses?premiumOnly=true`);
        if (res.data?.success && res.data?.data && res.data?.data.length > 0) {
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

            return {
              src: img,
              alt: biz.name,
            };
          });
          setSlides(loadedSlides);
        }
      } catch (err) {
        console.error("Failed to load premium businesses for background slides:", err);
      }
    };
    fetchPremium();
  }, []);

  useEffect(() => {
    start();
    return stop;
  }, [slides.length]);

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
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none z-10" />
    </section>
  );
}