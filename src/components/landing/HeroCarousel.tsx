"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SLIDES = [
  { src: "/carousel/yerevan.png", alt: "Yerevan city center", caption: "Yerevan" },
  { src: "/carousel/cafe.png", alt: "Armenian restaurant", caption: "Restaurants & Cafes" },
  { src: "/carousel/market.png", alt: "Armenian market", caption: "Local Markets" },
  { src: "/carousel/dilijan.png", alt: "Dilijan resort", caption: "Hotels & Resorts" },
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  const start = () => {
    intervalRef.current = setInterval(() => {
      setCurrent((p) => (p + 1) % SLIDES.length);
    }, 4000);
  };

  const stop = () => { if (intervalRef.current) clearInterval(intervalRef.current); };

  useEffect(() => { start(); return stop; }, []);

  const go = (dir: number) => {
    stop();
    setCurrent((p) => (p + dir + SLIDES.length) % SLIDES.length);
    start();
  };

  return (
    <section className="pb-16 sm:pb-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="relative rounded-2xl overflow-hidden group" style={{ aspectRatio: "21/9" }}>
          {/* Slides */}
          {SLIDES.map((slide, i) => (
            <div
              key={slide.src}
              className="absolute inset-0 transition-opacity duration-700 ease-in-out"
              style={{ opacity: i === current ? 1 : 0 }}
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                className="object-cover"
                sizes="(max-width: 1200px) 100vw, 1200px"
                priority={i === 0}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            </div>
          ))}

          {/* Caption */}
          <div className="absolute bottom-4 left-5 z-10">
            <span className="text-white text-sm font-medium drop-shadow-lg">{SLIDES[current].caption}</span>
          </div>

          {/* Arrows */}
          <button
            onClick={() => go(-1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => go(1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 right-5 z-10 flex gap-1.5">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => { stop(); setCurrent(i); start(); }}
                className={`h-1.5 rounded-full transition-all ${
                  i === current ? "w-5 bg-white" : "w-1.5 bg-white/40 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
