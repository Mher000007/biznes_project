"use client";
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { getApiUrl } from "@/lib/utils";
import axios from "axios";
import styles from "./PremiumLogoSlider.module.scss";

interface PremiumBrand {
  id: string;
  name: string;
  slug: string;
  logo: string;
}

const SCROLL_SPEED = 0.6;

export default function PremiumLogoSlider() {
  const [brands, setBrands] = useState<PremiumBrand[]>([]);
  const [loading, setLoading] = useState(true);

  const trackRef = useRef<HTMLDivElement>(null);
  const isHoveredRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    async function fetchPremiumBrands() {
      let premiumBrands: PremiumBrand[] = [];
      try {
        const res = await axios.get(`${getApiUrl()}/businesses/slider-businesses`);
        if (res.data?.success && res.data.data?.length > 0) {
          premiumBrands = res.data.data.map((b: any) => ({
            id: b._id || b.id,
            name: b.name,
            slug: b.slug,
            logo: b.logo || "",
          }));
        }
      } catch (err: any) {
        console.log("Failed to fetch premium brands from backend", err?.message || "Error");
      }

      setBrands(premiumBrands);
      setLoading(false);
    }

    fetchPremiumBrands();
  }, []);

  // JS-based smooth auto-scroll loop
  useEffect(() => {
    if (loading || brands.length === 0) return;

    const track = trackRef.current;
    if (!track) return;

    const tick = () => {
      if (track) {
        track.scrollLeft += SCROLL_SPEED;
        const halfWidth = track.scrollWidth / 2;
        if (track.scrollLeft >= halfWidth) {
          track.scrollLeft -= halfWidth;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [loading, brands.length]);

  if (loading || brands.length === 0) return null;

  let baseBrands = [...brands];
  while (baseBrands.length > 0 && baseBrands.length < 15) {
    baseBrands = [...baseBrands, ...brands];
  }
  const displayBrands = [...baseBrands, ...baseBrands];

  const renderBrandItem = (brand: PremiumBrand, key: string) => (
    <Link
      key={key}
      href={`/business/${brand.slug}`}
      className="flex-shrink-0 flex items-center justify-center transform transition-all duration-500 hover:scale-105 opacity-75 hover:opacity-100 group px-6"
      title={brand.name}
    >
      {brand.logo ? (
        <img
          src={brand.logo}
          alt={brand.name}
          className="h-20 sm:h-28 w-auto rounded-2xl object-contain drop-shadow-sm group-hover:drop-shadow-md transition-all duration-300"
        />
      ) : (
        <div className="flex items-center gap-4 transition-all duration-300">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center text-[hsl(var(--primary-foreground))] font-bold text-xl sm:text-2xl shadow-md ring-2 ring-[hsl(var(--primary))]/20">
            {brand.name.substring(0, 1).toUpperCase()}
          </div>
          <span className="text-xl sm:text-3xl font-bold text-[hsl(var(--foreground))] tracking-tight group-hover:text-[hsl(var(--primary))] transition-colors duration-300">
            {brand.name}
          </span>
        </div>
      )}
    </Link>
  );

  return (
    <div className="w-full py-8">
      <div
        ref={trackRef}
        className={styles.marqueeContainer}
        style={{
          overflowX: "auto",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          cursor: "default",
        }}
      >
        <div
          className={styles.marqueeContent}
          style={{ animation: "none", minWidth: "max-content" }}
        >
          {displayBrands.map((brand, i) =>
            renderBrandItem(brand, `${brand.id}-${i}`)
          )}
        </div>
      </div>
    </div>
  );
}
