"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import api from "@/lib/api";
import { Mail, AlertTriangle, X, CheckCircle2, Loader2 } from "lucide-react";

export default function UnverifiedBanner() {
  const { currentUser } = useAuth();
  const { locale } = useI18n();

  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!currentUser || currentUser.verified || dismissed) {
    return null;
  }

  const translations = {
    hy: {
      title: "Էլ. հասցեն հաստատված չէ",
      text: "Խնդրում ենք հաստատել Ձեր էլ. հասցեն՝ բոլոր հնարավորություններից օգտվելու համար:",
      btn: "Ուղարկել կրկին",
      sending: "Ուղարկվում է...",
      success: "Հաստատման հղումն ուղարկված է Ձեր էլ. հասցեին:",
      fail: "Չհաջողվեց ուղարկել: Խնդրում ենք փորձել ավելի ուշ:",
    },
    en: {
      title: "Email not verified",
      text: "Please verify your email address to unlock all business features.",
      btn: "Resend verification email",
      sending: "Sending...",
      success: "Verification email sent! Check your inbox.",
      fail: "Failed to send email. Please try again later.",
    },
    ru: {
      title: "Email не подтвержден",
      text: "Пожалуйста, подтвердите ваш email для доступа ко всем функциям.",
      btn: "Отправить повторно",
      sending: "Отправка...",
      success: "Письмо с подтверждением отправлено на ваш email!",
      fail: "Не удалось отправить письмо. Попробуйте позже.",
    },
  };

  const t = translations[locale] || translations.hy;
  const unit = locale === "hy" ? "վ" : locale === "ru" ? "с" : "s";

  const handleResend = async () => {
    if (cooldown > 0 || loading) return;

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await api.post("/auth/send-verification", { locale });
      if (res.data?.success) {
        setMessage(res.data.message || t.success);
        setCooldown(60);
      } else {
        setError(res.data?.message || t.fail);
        setCooldown(15);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t.fail);
      setCooldown(15);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3 text-amber-900 dark:text-amber-200 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div className="text-sm">
            <span className="font-semibold mr-1.5">{t.title}:</span>
            <span>{t.text}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {message ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> {message}
            </span>
          ) : (
            <button
              onClick={handleResend}
              disabled={loading || cooldown > 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Mail className="h-3.5 w-3.5" />
              )}
              {loading
                ? t.sending
                : cooldown > 0
                ? `${t.btn} (${cooldown}${unit})`
                : t.btn}
            </button>
          )}

          {error && <span className="text-xs text-red-500 font-medium">{error}</span>}

          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-amber-500/20 rounded-md text-amber-700 dark:text-amber-300 transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
