"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import api from "@/lib/api";
import { Mail, CheckCircle2, AlertCircle, Loader2, LogOut } from "lucide-react";

export default function VerifyPendingPage() {
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  const { locale } = useI18n();

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

  const translations = {
    hy: {
      title: "Էլ. հասցեի հաստատում",
      subtitle: "Խնդրում ենք հաստատել Ձեր էլ. հասցեն՝ Ձեր Findy հաշվին մուտք գործելու և բոլոր հնարավորություններից օգտվելու համար:",
      sentTo: "Հաստատման հղումն ուղարկվել է հետևյալ էլ. հասցեին:",
      resendBtn: "Ուղարկել կրկին",
      resending: "Ուղարկվում է...",
      success: "Հաստատման հղումն ուղարկված է Ձեր էլ. հասցեին:",
      fail: "Չհաջողվեց ուղարկել: Խնդրում ենք փորձել ավելի ուշ:",
      logoutBtn: "Դուրս գալ",
    },
    en: {
      title: "Verify Your Email Address",
      subtitle: "Please confirm your email address to access your Findy account and unlock all features.",
      sentTo: "A verification link was sent to your email address:",
      resendBtn: "Resend verification email",
      resending: "Sending...",
      success: "Verification email sent! Check your inbox.",
      fail: "Failed to send verification email. Please try again later.",
      logoutBtn: "Log out",
    },
    ru: {
      title: "Подтверждение Email",
      subtitle: "Пожалуйста, подтвердите ваш email, чтобы получить доступ к вашему аккаунту Findy и всем функциям.",
      sentTo: "Ссылка для подтверждения отправлена на ваш адрес электронной почты:",
      resendBtn: "Отправить повторно",
      resending: "Отправка...",
      success: "Письмо с подтверждением отправлено! Проверьте почтовый ящик.",
      fail: "Не удалось отправить письмо. Попробуйте позже.",
      logoutBtn: "Выйти",
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

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-20 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center shadow-xl space-y-6">
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="h-16 w-16 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-1">
            <Mail className="h-8 w-8" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t.title}
          </h1>

          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {t.subtitle}
          </p>
        </div>

        {currentUser?.email && (
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700/50">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t.sentTo}</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 font-mono break-all">
              {currentUser.email}
            </p>
          </div>
        )}

        {message && (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-xs font-semibold text-red-700 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3 pt-2">
          <button
            onClick={handleResend}
            disabled={loading || cooldown > 0}
            className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors disabled:opacity-50 shadow-md cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            {loading
              ? t.resending
              : cooldown > 0
                ? `${t.resendBtn} (${cooldown}${unit})`
                : t.resendBtn}
          </button>

          <button
            onClick={handleLogout}
            className="w-full h-10 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-xs transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            {t.logoutBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
