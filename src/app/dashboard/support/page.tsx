"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { useI18n } from "@/i18n";
import { Send, HeadphonesIcon, Loader2 } from "lucide-react";

export default function SupportChatPage() {
  const { t } = useI18n();
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    if (!currentUser) return;
    try {
      const res = await api.get(`/chat/${currentUser.id}`);
      if (res.data?.success) {
        setMessages(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || isSending) return;

    setIsSending(true);
    try {
      const res = await api.post("/chat", {
        message: newMessage,
        conversationId: currentUser.id
      });

      if (res.data?.success) {
        setNewMessage("");
        fetchMessages(); // Fetch immediately to update UI
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-120px)] flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[hsl(var(--foreground))] flex items-center gap-3">
            <HeadphonesIcon className="h-6 w-6 text-[hsl(var(--primary))]" />
            {t.dashboard.supportPage.title}
          </h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            {t.dashboard.supportPage.subtitle}
          </p>
        </div>
      </div>

      <div className="flex-1 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl overflow-hidden flex flex-col shadow-sm">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading && messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[hsl(var(--muted-foreground))]" />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[hsl(var(--muted-foreground))] opacity-60">
              <HeadphonesIcon className="h-12 w-12 mb-4" />
              <p>{(t.dashboard.supportPage as any).noMessagesYet || "No messages yet. Send a message to start the conversation."}</p>
            </div>
          ) : (
            messages.map((msg: any) => {
              const isAdmin = msg.senderName === "Admin";
              return (
                <div key={msg._id} className={`flex flex-col ${!isAdmin ? "items-end" : "items-start"}`}>
                  <div className="flex items-end gap-2 max-w-[80%]">
                    {isAdmin && (
                      <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-bold">A</span>
                      </div>
                    )}
                    <div 
                      className={`px-4 py-3 rounded-2xl ${
                        !isAdmin 
                          ? "bg-[hsl(var(--primary))] text-white rounded-br-sm" 
                          : "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] rounded-bl-sm"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1 mx-10">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-4 bg-[hsl(var(--muted))]/30 border-t border-[hsl(var(--border))]">
          <form onSubmit={handleSendMessage} className="flex items-center gap-3">
            <input
              type="text"
              placeholder={(t.dashboard.supportPage as any).typeYourMessage || "Type your message..."}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={isSending}
              className="flex-1 h-12 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/30 focus:border-[hsl(var(--primary))]"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className="h-12 px-6 bg-[hsl(var(--primary))] text-white rounded-xl font-medium text-sm flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {(t.dashboard.supportPage as any).send || "Send"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
