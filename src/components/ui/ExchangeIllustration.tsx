import React from "react";

export function ExchangeIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1024 768"
      className={`w-full max-w-2xl mx-auto drop-shadow-2xl hover:scale-105 transition-transform duration-500 ease-out ${className}`}
      fill="none"
    >
      {/* 
        The original 3D PNG image is embedded here inside the SVG. 
        This guarantees 100% pixel-perfect preservation of colors, details, and 3D effects.
      */}
      <image 
        href="/images/exchange-3d.png" 
        width="1024" 
        height="768" 
        preserveAspectRatio="xMidYMid meet" 
      />
    </svg>
  );
}
