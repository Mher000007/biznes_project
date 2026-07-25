"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { Lock, X, LogIn } from "lucide-react";
import { useI18n } from "@/i18n";

interface ToastOptions {
  message?: string;
  type?: "auth" | "info" | "error" | "success";
  duration?: number;
}

interface ToastContextValue {
  showToast: (options?: ToastOptions | string) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "auth" | "info" | "error" | "success";
  }>({
    visible: false,
    message: "",
    type: "auth"
  });

  const [isClosing, setIsClosing] = useState(false);

  const { locale, t } = useI18n();

  const hideToast = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
      setIsClosing(false);
    }, 350);
  }, []);

  const showToast = useCallback((options?: ToastOptions | string) => {
    let msg = "";
    let toastType: "auth" | "info" | "error" | "success" = "auth";

    if (typeof options === "string") {
      msg = options;
    } else if (options) {
      msg = options.message || "";
      if (options.type) toastType = options.type;
    }

    if (!msg || msg === "Սրանցից օգտվելու համար անհրաժեշտ է գրանցվել որպես user") {
      msg = (t as any).auth?.authRequired || (
        locale === "hy"
          ? "Այս ֆունկցիայից օգտվելու համար, խնդրում ենք մուտք գործել կամ գրանցվել"
          : locale === "ru"
          ? "Чтобы воспользоваться этой функцией, пожалуйста, войдите или зарегистрируйтесь"
          : "To access this feature, please sign in or register an account"
      );
    }

    setIsClosing(false);
    setToast({
      visible: true,
      message: msg,
      type: toastType
    });
  }, [locale]);

  useEffect(() => {
    if (toast.visible && !isClosing) {
      const timer = setTimeout(() => {
        hideToast();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible, isClosing, hideToast]);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}

      {/* Custom Keyframe Animations */}
      <style jsx global>{`
        @keyframes toastSoftIn {
          0% {
            opacity: 0;
            transform: translateY(32px) scale(0.92);
            filter: blur(4px);
          }
          60% {
            opacity: 1;
            transform: translateY(-4px) scale(1.01);
            filter: blur(0px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0px);
          }
        }

        @keyframes toastSoftOut {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0px);
          }
          100% {
            opacity: 0;
            transform: translateY(24px) scale(0.94);
            filter: blur(4px);
          }
        }

        .animate-toast-in {
          animation: toastSoftIn 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-toast-out {
          animation: toastSoftOut 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>

      {toast.visible && (
        <div
          className={`fixed bottom-6 left-4 right-4 sm:right-auto sm:left-6 z-[99999] max-w-md ${
            isClosing ? "animate-toast-out" : "animate-toast-in"
          }`}
        >
          <div className="bg-[hsl(var(--card))]/95 text-[hsl(var(--card-foreground))] backdrop-blur-xl border border-[hsl(var(--border))] rounded-2xl p-4 shadow-[0_12px_35px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.55)] flex items-center justify-between gap-3.5 ring-1 ring-[hsl(var(--border))]/50">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400 shadow-inner transition-transform duration-300 hover:scale-105">
                <Lock className="w-5 h-5" />
              </div>
              <p className="text-xs sm:text-sm font-semibold leading-snug text-[hsl(var(--foreground))]">
                {toast.message}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/signin"
                onClick={() => hideToast()}
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold rounded-xl transition-all duration-200 shadow-md shadow-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/35 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>
                  {(t as any).auth?.signInOrRegister || (
                    locale === "hy"
                      ? "Մուտք / Գրանցում"
                      : locale === "ru"
                      ? "Войти / Регистрация"
                      : "Sign In / Register"
                  )}
                </span>
              </Link>
              <button
                onClick={hideToast}
                className="p-1.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] rounded-lg hover:bg-[hsl(var(--muted))] transition-colors cursor-pointer"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
