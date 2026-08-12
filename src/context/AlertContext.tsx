"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { AlertCircle, CheckCircle, Info, AlertTriangle, Trash2, X } from "lucide-react";
import { useI18n } from "@/i18n";

type AlertType = "info" | "success" | "warning" | "error" | "delete";

interface AlertOptions {
  title?: string;
  message: string;
  type?: AlertType;
  confirmText?: string;
  cancelText?: string;
  isConfirm?: boolean;
}

interface AlertContextValue {
  showAlert: (options: AlertOptions | string) => Promise<boolean>;
  showConfirm: (options: AlertOptions | string) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextValue | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const { locale, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<AlertOptions>({ message: "" });
  const [resolvePromise, setResolvePromise] = useState<((val: boolean) => void) | null>(null);

  const showAlert = useCallback((opts: AlertOptions | string): Promise<boolean> => {
    return new Promise((resolve) => {
      setResolvePromise(() => resolve);
      if (typeof opts === "string") {
        setOptions({ message: opts, type: "info", isConfirm: false });
      } else {
        setOptions({ ...opts, type: opts.type || "info", isConfirm: false });
      }
      setIsOpen(true);
      document.body.style.overflow = "hidden";
    });
  }, []);

  const showConfirm = useCallback((opts: AlertOptions | string): Promise<boolean> => {
    return new Promise((resolve) => {
      setResolvePromise(() => resolve);
      if (typeof opts === "string") {
        setOptions({ message: opts, type: "warning", isConfirm: true });
      } else {
        setOptions({ ...opts, type: opts.type || "warning", isConfirm: true });
      }
      setIsOpen(true);
      document.body.style.overflow = "hidden";
    });
  }, []);

  const handleClose = (result: boolean) => {
    setIsOpen(false);
    document.body.style.overflow = "";
    if (resolvePromise) {
      resolvePromise(result);
      setResolvePromise(null);
    }
  };

  const getTypeStyles = (type: AlertType) => {
    switch (type) {
      case "error":
      case "delete":
        return {
          bg: "bg-red-500/10",
          border: "border-red-500/20",
          text: "text-red-500",
          boxBg: "bg-red-500/5",
          boxText: "text-red-600/90",
          btnBg: "bg-red-500",
          btnHover: "hover:bg-red-600",
          btnShadow: "shadow-red-500/20",
          Icon: type === "delete" ? Trash2 : AlertCircle,
        };
      case "success":
        return {
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/20",
          text: "text-emerald-500",
          boxBg: "bg-emerald-500/5",
          boxText: "text-emerald-600/90",
          btnBg: "bg-emerald-500",
          btnHover: "hover:bg-emerald-600",
          btnShadow: "shadow-emerald-500/20",
          Icon: CheckCircle,
        };
      case "warning":
        return {
          bg: "bg-amber-500/10",
          border: "border-amber-500/20",
          text: "text-amber-500",
          boxBg: "bg-amber-500/5",
          boxText: "text-amber-600/90",
          btnBg: "bg-amber-500",
          btnHover: "hover:bg-amber-600",
          btnShadow: "shadow-amber-500/20",
          Icon: AlertTriangle,
        };
      case "info":
      default:
        return {
          bg: "bg-[hsl(var(--primary))]/10",
          border: "border-[hsl(var(--primary))]/20",
          text: "text-[hsl(var(--primary))]",
          boxBg: "bg-[hsl(var(--primary))]/5",
          boxText: "text-[hsl(var(--primary))]/90",
          btnBg: "bg-[hsl(var(--primary))]",
          btnHover: "hover:opacity-90",
          btnShadow: "shadow-[hsl(var(--primary))]/20",
          Icon: Info,
        };
    }
  };

  const getTranslatedTitle = (type: AlertType, customTitle?: string) => {
    if (customTitle) return customTitle;
    switch (type) {
      case "error": return locale === "hy" ? "Սխալ" : locale === "ru" ? "Ошибка" : "Error";
      case "delete": return locale === "hy" ? "Հաստատել ջնջումը" : locale === "ru" ? "Подтвердить удаление" : "Confirm Deletion";
      case "success": return locale === "hy" ? "Հաջողություն" : locale === "ru" ? "Успех" : "Success";
      case "warning": return locale === "hy" ? "Ուշադրություն" : locale === "ru" ? "Внимание" : "Warning";
      case "info":
      default: return locale === "hy" ? "Տեղեկություն" : locale === "ru" ? "Информация" : "Information";
    }
  };

  const getTranslatedConfirmText = (type: AlertType, customText?: string) => {
    if (customText) return customText;
    if (type === "delete") return locale === "hy" ? "Ջնջել" : locale === "ru" ? "Удалить" : "Delete";
    return locale === "hy" ? "Լավ" : locale === "ru" ? "Хорошо" : "OK";
  };

  const getTranslatedCancelText = (customText?: string) => {
    if (customText) return customText;
    return locale === "hy" ? "Չեղարկել" : locale === "ru" ? "Отмена" : "Cancel";
  };

  if (!isOpen) {
    return (
      <AlertContext.Provider value={{ showAlert, showConfirm }}>
        {children}
      </AlertContext.Provider>
    );
  }

  const typeStyles = getTypeStyles(options.type || "info");
  const title = getTranslatedTitle(options.type || "info", options.title);
  const confirmText = getTranslatedConfirmText(options.type || "info", options.confirmText);
  const cancelText = getTranslatedCancelText(options.cancelText);

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <div className="fixed inset-0 z-[110] overflow-y-auto overscroll-contain bg-black/60 backdrop-blur-md animate-in fade-in duration-300 flex items-center justify-center p-4">
        <div 
          className="relative w-full max-w-sm bg-[hsl(var(--background))] border border-[hsl(var(--border))]/50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] rounded-[2rem] overflow-hidden animate-in zoom-in-[0.98] fade-in duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleClose(false)}
            className="absolute top-5 right-5 p-2 rounded-full bg-[hsl(var(--muted))]/50 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors z-20"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 sm:p-8 pt-10">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto border ${typeStyles.bg} ${typeStyles.border} ${typeStyles.text}`}>
              <typeStyles.Icon className="w-8 h-8" />
            </div>
            
            <h2 className="text-2xl font-black text-center text-[hsl(var(--foreground))] mb-4">
              {title}
            </h2>
            
            <div className={`rounded-xl p-5 mb-8 border ${typeStyles.boxBg} ${typeStyles.border}`}>
              <p className={`text-sm font-medium text-center leading-relaxed ${typeStyles.boxText}`}>
                {options.message}
              </p>
            </div>

            <div className="flex gap-3">
              {options.isConfirm && (
                <button
                  onClick={() => handleClose(false)}
                  className="flex-1 py-3.5 rounded-xl font-bold text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))]/50 hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors text-sm"
                >
                  {cancelText}
                </button>
              )}
              <button
                onClick={() => handleClose(true)}
                className={`flex-1 py-3.5 rounded-xl font-bold text-white transition-colors text-sm shadow-lg ${typeStyles.btnBg} ${typeStyles.btnHover} ${typeStyles.btnShadow}`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
}
