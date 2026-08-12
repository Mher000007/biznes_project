import React, { useEffect } from "react";
import { AlertTriangle, X, Trash2 } from "lucide-react";
import { useI18n } from "@/i18n";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
}

export default function ConfirmDeleteModal({ isOpen, onClose, onConfirm, title, message }: ConfirmDeleteModalProps) {
  const { t } = useI18n();
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.body.style.touchAction = "none";
      document.documentElement.style.touchAction = "none";
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
        <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-[hsl(var(--muted))]/50 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 pt-10">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20 text-red-500 mx-auto">
            <Trash2 className="w-8 h-8" />
          </div>
          
          <h2 className="text-2xl font-black text-center text-[hsl(var(--foreground))] mb-4">
            {title || t.billing.receipts.confirmDeleteTitle}
          </h2>
          
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5 mb-8">
            <p className="text-sm font-medium text-red-600/90 text-center leading-relaxed">
              {message}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 rounded-xl font-bold text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))]/50 hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors text-sm"
            >
              {t.billing.receipts.cancel}
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-3.5 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors text-sm shadow-lg shadow-red-500/20"
            >
              {t.billing.receipts.delete}
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
