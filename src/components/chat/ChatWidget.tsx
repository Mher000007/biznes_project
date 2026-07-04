"use client";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { toggleChat, addMessage, setLoading, setSessionId } from "@/store/slices/chatSlice";
import type { ChatMessage, BusinessSuggestion } from "@/store/slices/chatSlice";
import { MessageCircle, X, Send, Star, MapPin, ArrowRight, Sparkles, Bot } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { useI18n } from "@/i18n";

function BusinessCard({ biz }: { biz: BusinessSuggestion }) {
  return (
    <Link
      href={`/business/${biz.slug}`}
      className="flex gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 transition-all hover:shadow-md hover:border-[hsl(var(--primary))]/30"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-sm font-bold">
        {biz.name[0]}
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-xs font-semibold truncate">{biz.name}</h4>
        <p className="text-[10px] text-[hsl(var(--muted-foreground))] truncate">{biz.shortDescription}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="flex items-center gap-0.5 text-[10px]">
            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />{biz.rating}
          </span>
          <span className="flex items-center gap-0.5 text-[10px] text-[hsl(var(--muted-foreground))]">
            <MapPin className="h-2.5 w-2.5" />{biz.city}
          </span>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 self-center text-[hsl(var(--muted-foreground))]" />
    </Link>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const { t } = useI18n();
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}>
      <div className={`max-w-[85%] space-y-2`}>
        {!isUser && (
          <div className="flex items-center gap-2 mb-1 pl-1">
            <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-green-500 to-emerald-400 shadow-sm shadow-green-500/20">
              <Bot className="h-3.5 w-3.5 text-white" />
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-400 border border-white"></span>
            </div>
            <span className="text-[11px] font-bold tracking-wide text-[hsl(var(--muted-foreground))]">{t.chat?.assistantName || "Findy Assistant"}</span>
          </div>
        )}
        <div className={`relative px-4 py-3 text-[14px] leading-relaxed whitespace-pre-wrap transition-all duration-300 ${
          isUser
            ? "bg-[hsl(var(--primary))] text-white rounded-[20px] rounded-tr-[4px] shadow-sm"
            : "bg-white/60 dark:bg-slate-800/60 backdrop-blur-md text-[hsl(var(--foreground))] rounded-[20px] rounded-tl-[4px] border border-white/40 dark:border-white/10 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]"
        }`}>
          {msg.content.split("**").map((part, i) =>
            i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : <span key={i}>{part}</span>
          )}
        </div>

        {msg.suggestions && msg.suggestions.length > 0 && (
          <div className="space-y-2 mt-2">
            {msg.suggestions.map(biz => (
              <BusinessCard key={biz.id} biz={biz} />
            ))}
          </div>
        )}

        {msg.quickReplies && msg.quickReplies.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {msg.quickReplies.map(reply => (
              <QuickReplyButton key={reply} text={reply} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function QuickReplyButton({ text }: { text: string }) {
  const { t } = useI18n();
  const dispatch = useDispatch();
  const sessionId = useSelector((s: RootState) => s.chat.sessionId);

  const handleClick = async () => {
    const cleanText = text.replace(/^[\u{1F300}-\u{1F9FF}]\s*/u, "");

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: cleanText,
      timestamp: Date.now(),
    };
    dispatch(addMessage(userMsg));
    dispatch(setLoading(true));

    try {
      const res = await axios.post("/api/ai/chat", { message: cleanText, sessionId });
      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: res.data.response,
        timestamp: Date.now(),
        suggestions: res.data.suggestions,
        quickReplies: res.data.quickReplies,
      };
      dispatch(addMessage(aiMsg));
      if (res.data.sessionId) dispatch(setSessionId(res.data.sessionId));
    } catch {
      dispatch(addMessage({
        id: `msg-err-${Date.now()}`, role: "assistant",
        content: t.chat?.error || "Sorry, something went wrong.", timestamp: Date.now(),
      }));
    }
    dispatch(setLoading(false));
  };

  return (
    <button
      onClick={handleClick}
      className="group relative overflow-hidden rounded-full border border-[hsl(var(--border))] bg-white dark:bg-slate-800 px-4 py-1.5 text-[12px] font-medium text-[hsl(var(--foreground))] transition-all duration-300 hover:border-green-500/40 hover:shadow-[0_0_15px_-3px_rgba(34,197,94,0.15)] hover:-translate-y-0.5 active:translate-y-0"
    >
      <div className="absolute inset-0 bg-green-500/0 transition-colors duration-300 group-hover:bg-green-500/5" />
      <span className="relative z-10 flex items-center gap-1.5">{text}</span>
    </button>
  );
}

export default function ChatWidget() {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { isOpen, messages, isLoading, sessionId } = useSelector((s: RootState) => s.chat);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useI18n();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  // Show welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      dispatch(addMessage({
        id: "welcome",
        role: "assistant",
        content: t.chat?.welcome || "Welcome to Findy AI!",
        timestamp: Date.now(),
        quickReplies: [
          t.chat?.quickReplies?.restaurants || "🍽️ Restaurants",
          t.chat?.quickReplies?.tech || "💻 Tech Companies",
          t.chat?.quickReplies?.hotels || "🏨 Hotels & Spas",
          t.chat?.quickReplies?.help || "Help"
        ],
      }));
    }
  }, [isOpen, messages.length, dispatch, t]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const text = input.trim();
    setInput("");

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    dispatch(addMessage(userMsg));
    dispatch(setLoading(true));

    try {
      const res = await axios.post("/api/ai/chat", { message: text, sessionId });
      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: res.data.response,
        timestamp: Date.now(),
        suggestions: res.data.suggestions,
        quickReplies: res.data.quickReplies,
      };
      dispatch(addMessage(aiMsg));
      if (res.data.sessionId) dispatch(setSessionId(res.data.sessionId));
    } catch {
      dispatch(addMessage({
        id: `msg-err-${Date.now()}`, role: "assistant",
        content: t.chat?.error || "Sorry, I couldn't process your request. Please try again.", timestamp: Date.now(),
      }));
    }
    dispatch(setLoading(false));
  };

  if (pathname.startsWith("/admin-secure")) {
    return null;
  }

  return (
    <>
      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] animate-scale-in">
          <div className="flex flex-col h-[520px] rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl shadow-black/10 overflow-hidden">
            {/* Header - White with faint green glow */}
            <div className="relative px-5 py-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-[hsl(var(--border))] overflow-hidden shadow-sm transition-colors">
              {/* Faint green glow at the bottom */}
              <div className="absolute -bottom-4 -left-4 -right-4 h-12 bg-gradient-to-t from-emerald-500/30 to-transparent blur-2xl opacity-70"></div>
              
              <div className="relative flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 shadow-sm relative group">
                    <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400 group-hover:rotate-12 transition-transform duration-300" />
                    <span className="absolute top-0 right-0 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold tracking-wide text-slate-900 dark:text-white drop-shadow-sm">{t.chat?.title || "Findy AI"}</h3>
                    <p className="text-[11px] font-semibold text-emerald-600/80 dark:text-emerald-400/80 tracking-wider uppercase">{t.chat?.subtitle || "Premium Assistant"}</p>
                  </div>
                </div>
                <button
                  onClick={() => dispatch(toggleChat())}
                  className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:rotate-90 transition-all duration-300 border border-transparent hover:border-slate-300 dark:hover:border-slate-600"
                  aria-label="Close widget"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar bg-gradient-to-b from-transparent via-slate-50/30 to-slate-100/50 dark:via-slate-900/30 dark:to-slate-900/50">
              {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
              {isLoading && (
                <div className="flex justify-start animate-fade-in">
                  <div className="max-w-[85%] space-y-2">
                    <div className="flex items-center gap-2 mb-1 pl-1">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-green-500 to-emerald-400 shadow-sm shadow-green-500/20">
                        <Bot className="h-3.5 w-3.5 text-white" />
                      </div>
                      <span className="text-[11px] font-bold tracking-wide text-[hsl(var(--muted-foreground))]">{t.chat?.typing || "Findy AI is typing"}</span>
                    </div>
                    <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-[20px] rounded-tl-[4px] border border-white/40 dark:border-white/10 px-4 py-3.5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex items-center gap-1.5 w-fit">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500/80 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-[hsl(var(--border))] p-3">
              <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t.chat?.placeholder || "Ask about businesses..."}
                  className="flex-1 bg-transparent text-sm focus:outline-none dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="flex h-8 w-8 items-center justify-center rounded-full gradient-primary text-white transition-all disabled:opacity-40 hover:shadow-lg"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => dispatch(toggleChat())}
        className={`fixed bottom-4 right-4 sm:right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 backdrop-blur-md border border-green-500/30 text-green-600 shadow-lg shadow-green-500/10 transition-all hover:scale-110 hover:bg-green-500/20 ${isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
          }`}
        aria-label="Open AI chat"
      >
        <MessageCircle className="h-7 w-7" strokeWidth={2} />
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20 pointer-events-none" />
      </button>
    </>
  );
}
