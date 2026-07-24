"use client";
import React, { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";

interface FlyingBookmarkProps {
  startX: number;
  startY: number;
  onComplete: () => void;
}

export function FlyingBookmark({ startX, startY, onComplete }: FlyingBookmarkProps) {
  const [style, setStyle] = useState<React.CSSProperties>({
    position: "fixed",
    left: `${startX}px`,
    top: `${startY}px`,
    transform: "translate(-50%, -50%) scale(1.5)",
    opacity: 1,
    zIndex: 9999,
    transition: "all 0.8s cubic-bezier(0.25, 1, 0.5, 1)",
    pointerEvents: "none",
  });

  useEffect(() => {
    // Wait a brief moment to allow the initial render at start coordinates
    const timer1 = setTimeout(() => {
      let targetEl = document.getElementById("navbar-bookmark-icon");
      let rect = targetEl?.getBoundingClientRect();

      // If on mobile or target hidden, fallback to hamburger menu or just right top
      if (!rect || (rect.width === 0 && rect.height === 0)) {
        targetEl = document.getElementById("mobile-menu-btn");
        rect = targetEl?.getBoundingClientRect();
      }

      if (rect && rect.width > 0) {
        // The center of the target icon
        const targetX = rect.left + rect.width / 2;
        const targetY = rect.top + rect.height / 2;

        setStyle((prev) => ({
          ...prev,
          left: `${targetX}px`,
          top: `${targetY}px`,
          transform: "translate(-50%, -50%) scale(0.2)",
          opacity: 0.2,
        }));
      } else {
        // Fallback to top right if completely missing
        setStyle((prev) => ({
          ...prev,
          left: "90vw",
          top: "10vh",
          transform: "translate(-50%, -50%) scale(0.2)",
          opacity: 0,
        }));
      }
    }, 20);

    const timer2 = setTimeout(() => {
      onComplete();
    }, 850);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [startX, startY, onComplete]);

  return (
    <div style={style}>
      <Bookmark
        className="w-6 h-6 text-amber-500 fill-amber-500 drop-shadow-md"
      />
    </div>
  );
}

export function FlyingBookmarkProvider() {
  const [animations, setAnimations] = useState<{ id: string; x: number; y: number }[]>([]);

  useEffect(() => {
    const handleFlyEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ x: number; y: number }>;
      const { x, y } = customEvent.detail;
      setAnimations((prev) => [...prev, { id: Math.random().toString(36).substr(2, 9), x, y }]);
    };

    window.addEventListener("fly-to-bookmark", handleFlyEvent);
    return () => window.removeEventListener("fly-to-bookmark", handleFlyEvent);
  }, []);

  const removeAnimation = (id: string) => {
    setAnimations((prev) => prev.filter((anim) => anim.id !== id));
  };

  return (
    <>
      {animations.map((anim) => (
        <FlyingBookmark
          key={anim.id}
          startX={anim.x}
          startY={anim.y}
          onComplete={() => removeAnimation(anim.id)}
        />
      ))}
    </>
  );
}
