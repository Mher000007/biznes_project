"use client";
import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { toggleChat, addMessage, setLoading, setSessionId } from "@/store/slices/chatSlice";
import type { ChatMessage, BusinessSuggestion } from "@/store/slices/chatSlice";
import { MessageCircle, X, Send, Star, MapPin, ArrowRight, Sparkles, Bot } from "lucide-react";
import Link from "next/link";
import axios from "axios";

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
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}>
      <div className={`max-w-[85%] space-y-2`}>
        {!isUser && (
          <div className="flex items-center gap-1.5 mb-1">
            <div className="flex h-5 w-5 items-center justify-center rounded-full gradient-primary">
              <Bot className="h-3 w-3 text-white" />
            </div>
            <span className="text-[10px] font-medium text-[hsl(var(--muted-foreground))]">ArmenBiz AI</span>
          </div>
        )}
        <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-[hsl(var(--primary))] text-white rounded-br-md"
            : "bg-[hsl(var(--muted))] rounded-bl-md"
        }`}>
          {msg.content.split("**").map((part, i) =>
            i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
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
        content: "Sorry, something went wrong. Please try again.", timestamp: Date.now(),
      }));
    }
    dispatch(setLoading(false));
  };

  return (
    <button
      onClick={handleClick}
      className="rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-1 text-[11px] font-medium transition-all hover:border-[hsl(var(--primary))]/50 hover:bg-[hsl(var(--primary))]/5"
    >
      {text}
    </button>
  );
}

export default function ChatWidget() {
  const dispatch = useDispatch();
  const { isOpen, messages, isLoading, sessionId } = useSelector((s: RootState) => s.chat);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
        content: "👋 Welcome to ArmenBiz AI! I'm your personal assistant for discovering businesses across Armenia.\n\nAsk me anything — find restaurants, book services, or explore local businesses.",
        timestamp: Date.now(),
        quickReplies: ["🍽️ Restaurants", "💻 Tech Companies", "🏨 Hotels & Spas", "Help"],
      }));
    }
  }, [isOpen, messages.length, dispatch]);

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
        content: "Sorry, I couldn't process your request. Please try again.", timestamp: Date.now(),
      }));
    }
    dispatch(setLoading(false));
  };

  return (
    <>
      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] animate-scale-in">
          <div className="flex flex-col h-[520px] rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl shadow-black/10 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 gradient-primary text-white">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <div>
                  <h3 className="text-sm font-semibold">ArmenBiz AI</h3>
                  <p className="text-[10px] text-white/70">Your local business assistant</p>
                </div>
              </div>
              <button onClick={() => dispatch(toggleChat())} className="h-7 w-7 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
              {isLoading && (
                <div className="flex justify-start animate-fade-in">
                  <div className="flex items-center gap-1.5 rounded-2xl bg-[hsl(var(--muted))] px-4 py-3 rounded-bl-md">
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--muted-foreground))] animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--muted-foreground))] animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--muted-foreground))] animate-bounce" style={{ animationDelay: "300ms" }} />
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
                  placeholder="Ask about businesses..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-[hsl(var(--muted-foreground))]"
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
        className={`fixed bottom-4 right-4 sm:right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full gradient-primary text-white shadow-xl shadow-[hsl(var(--primary))]/30 transition-all hover:scale-105 hover:shadow-2xl ${
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        }`}
        aria-label="Open AI chat"
      >
        <MessageCircle className="h-6 w-6" />
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full gradient-primary animate-ping opacity-20" />
      </button>
    </>
  );
}
