"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import axios from "axios";
import { getApiUrl } from "@/lib/utils";

interface SlideItem {
  src: string;
  alt: string;
  caption: string;
  href?: string;
}

export default function HeroCarousel() {
  const [slides, setSlides] = useState<SlideItem[]>([]);
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

  // Fetch admin hero images or premium businesses on mount
  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const API = getApiUrl();

        // 1. Try admin-configured hero images first
        const heroRes = await axios.get(`${API}/hero-images`);
        if (heroRes.data?.success && heroRes.data?.data && heroRes.data.data.length > 0) {
          const loadedSlides = heroRes.data.data.map((url: string, idx: number) => ({
            src: url,
            alt: `Hero image ${idx + 1}`,
            caption: `Slide ${idx + 1}`,
          }));
          setSlides(loadedSlides);
          return;
        }

        // 2. Fallback: premium businesses
        const res = await axios.get(`${API}/businesses?premiumOnly=true`);
        if (res.data?.success && res.data?.data && res.data?.data.length > 0) {
          const loadedSlides: SlideItem[] = [];
          res.data.data.forEach((biz: any) => {
            let img = "";
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

            if (img) {
              loadedSlides.push({
                src: img,
                alt: biz.name,
                caption: biz.name,
                href: `/business/${biz.slug}`,
              });
            }
          });
          setSlides(loadedSlides);
        } else {
          setSlides([]);
        }
      } catch (err: any) {
        console.log("Failed to load hero images for carousel:", err?.message || "Error");
        setSlides([]);
      }
    };
    fetchSlides();
  }, []);

  useEffect(() => {
    start();
    return stop;
  }, [slides.length]); // Re-run when slides length changes to prevent stale closures

  const go = (dir: number) => {
    stop();
    setCurrent((p) => (p + dir + slides.length) % slides.length);
    start();
  };

  return (
    <section className="pb-16 sm:pb-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="relative rounded-2xl overflow-hidden group shadow-sm bg-neutral-900" style={{ aspectRatio: "21/9" }}>

          {/* Slides */}
          {slides.map((slide, i) => {
            const slideContent = (
              <div className="w-full h-full relative">
                <img
                  src={slide.src}
                  alt={slide.alt}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              </div>
            );

            return (
              <div
                key={`${slide.src}-${i}`}
                className="absolute inset-0 transition-opacity duration-700 ease-in-out"
                style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}
              >
                {slide.href ? (
                  <Link href={slide.href} className="block w-full h-full relative cursor-pointer">
                    {slideContent}
                  </Link>
                ) : (
                  slideContent
                )}
              </div>
            );
          })}

          {/* Caption */}
          {slides.length > 0 && (
            <div className="absolute bottom-4 left-5 z-10 pointer-events-none">
              <span className="text-white text-sm sm:text-base font-bold drop-shadow-md tracking-wide">
                {slides[current].caption}
              </span>
            </div>
          )}

          {/* Arrows */}
          <button
            onClick={() => go(-1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => go(1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50 cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 right-5 z-10 flex gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  stop();
                  setCurrent(i);
                  start();
                }}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${i === current ? "w-5 bg-white" : "w-1.5 bg-white/40 hover:bg-white/60"
                  }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

