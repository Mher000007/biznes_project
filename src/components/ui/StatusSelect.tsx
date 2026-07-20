import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Clock } from 'lucide-react';
import { useI18n } from '@/i18n';

export interface StatusSelectProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'value'> {
  value: "all" | "open" | "closed";
  onChange: (val: "all" | "open" | "closed") => void;
  className?: string;
  style?: React.CSSProperties;
}

export function StatusSelect({ 
  value, 
  onChange, 
  className,
  style,
  ...props 
}: StatusSelectProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options = [
    { value: "all" as const, label: t.discover?.allHours || "All Hours" },
    { value: "open" as const, label: t.business?.openNow || "Open Now" },
    { value: "closed" as const, label: t.business?.closed || "Closed" },
  ];

  // Close when clicking outside or scrolling outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current && 
        !wrapperRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    
    function handleScroll(e: Event) {
      if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) {
        return;
      }
      setIsOpen(false);
    }
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", handleScroll);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [isOpen]);

  const handleSelect = (val: "all" | "open" | "closed") => {
    onChange(val);
    setIsOpen(false);
  };

  const toggleOpen = () => {
    if (!isOpen && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom,
        left: rect.left,
        width: rect.width
      });
    }
    setIsOpen(!isOpen);
  };

  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div className="relative w-full h-full" ref={wrapperRef}>
      <button
        type="button"
        onClick={toggleOpen}
        className={`focus:outline-none flex items-center justify-between w-full text-left ${className || 'min-h-[38px] px-3 py-2 bg-transparent'}`}
        style={style}
        {...props}
      >
        <span className={`block truncate pr-2 ${value === "all" ? 'text-[hsl(var(--muted-foreground))]' : 'font-medium text-[hsl(var(--foreground))]'}`}>
          {selectedOption.label}
        </span>
        <ChevronDown className={`w-4 h-4 text-[hsl(var(--muted-foreground))] transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed z-[9999] mt-1 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 py-1"
          style={{
            top: coords.top,
            left: coords.left,
            minWidth: Math.max(200, coords.width), 
            maxHeight: `calc(100vh - 20px - ${coords.top}px)`,
          }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 hover:bg-[hsl(var(--accent))] ${value === opt.value ? 'bg-[hsl(var(--primary))/10] text-[hsl(var(--primary))] font-medium' : 'text-[hsl(var(--foreground))]'}`}
            >
              <Clock className={`w-4 h-4 ${opt.value === 'open' ? 'text-green-500' : opt.value === 'closed' ? 'text-red-500' : 'text-[hsl(var(--muted-foreground))]'}`} />
              {opt.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
