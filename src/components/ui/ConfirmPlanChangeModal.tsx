import React, { useState, useEffect } from "react";
import { AlertTriangle, X, Check } from "lucide-react";
import { useI18n } from "@/i18n";

interface ConfirmPlanChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmPlanChangeModal({ isOpen, onClose, onConfirm }: ConfirmPlanChangeModalProps) {
  const { t } = useI18n();
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.body.style.touchAction = "none";
      document.documentElement.style.touchAction = "none";
      setAgreed(false);
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.touchAction = "";
      document.documentElement.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.touchAction = "";
      document.documentElement.style.touchAction = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] overflow-y-auto overscroll-contain bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6" onClick={onClose}>
        <div 
          className="relative w-full max-w-md bg-[hsl(var(--background))] border border-[hsl(var(--border))]/50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] rounded-[2rem] overflow-hidden animate-in zoom-in-[0.98] fade-in duration-300"
          onClick={(e) => e.stopPropagation()}
        >
        <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-[hsl(var(--muted))]/50 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 pt-10">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6 border border-amber-500/20 text-amber-500 mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          
          <h2 className="text-2xl font-black text-center text-[hsl(var(--foreground))] mb-4">{t.billing.confirmChange.title}</h2>
          
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mb-6">
            <p className="text-sm font-medium text-amber-600/90 text-center leading-relaxed">
              {t.billing.confirmChange.warning}
            </p>
          </div>

          <label className="flex items-start gap-3 p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/20 cursor-pointer hover:bg-[hsl(var(--muted))]/40 transition-colors mb-8 group">
            <input 
              type="checkbox" 
              className="hidden" 
              checked={agreed} 
              onChange={(e) => setAgreed(e.target.checked)} 
            />
            <div className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${agreed ? 'bg-[hsl(var(--primary))] border-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'border-[hsl(var(--border))] text-transparent group-hover:border-[hsl(var(--primary))]/50'}`}>
              <Check className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-medium text-[hsl(var(--foreground))] leading-snug select-none">{t.billing.confirmChange.agree}</span>
          </label>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 rounded-xl font-bold text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))]/50 hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors text-sm"
            >
              {t.billing.confirmChange.cancel}
            </button>
            <button
              onClick={onConfirm}
              disabled={!agreed}
              className="flex-1 py-3.5 rounded-xl font-bold text-white bg-amber-500 hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:hover:bg-amber-500 text-sm shadow-lg shadow-amber-500/20"
            >
              {t.billing.confirmChange.confirm}
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
