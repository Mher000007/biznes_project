"use client";
import { useEffect, useRef, useState } from "react";

const STATS = [
  { value: 906, suffix: "+", label: "Businesses" },
  { value: 15, suffix: "", label: "Cities" },
  { value: 8, suffix: "", label: "Industries" },
  { value: 25, suffix: "K+", label: "Monthly visitors" },
];

function Counter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const step = (ts: number) => {
            if (!start) start = ts;
            const p = Math.min((ts - start) / 1500, 1);
            setCount(Math.floor(p * target));
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <div ref={ref} className="text-3xl font-bold tracking-tight">{count}{suffix}</div>;
}

export default function StatsSection() {
  return (
    <section className="hidden py-16 sm:py-24 border-t border-[hsl(var(--border))]">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-12">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <div className="text-4xl sm:text-5xl font-semibold text-[hsl(var(--foreground))] mb-2">
                <Counter target={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-sm sm:text-base text-[hsl(var(--muted-foreground))]">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
