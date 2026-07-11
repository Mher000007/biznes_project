"use client";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { getApiUrl } from "@/lib/utils";
import { HeadphonesIcon, Send, Loader2, UserCircle2 } from "lucide-react";

const C = {
  bg: "#0f0f13",
  card: "#18181b",
  border: "rgba(255, 255, 255, 0.08)",
  text: "#fafafa",
  muted: "#a1a1aa",
  primary: "#7c3aed", // violet-600
  faint: "#52525b",
};

export default function AdminLiveChat() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    try {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("admin-token") : null;
      const res = await axios.get(`${getApiUrl()}/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        setConversations(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("admin-token") : null;
      const res = await axios.get(`${getApiUrl()}/chat/${convId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        setMessages(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedConv) {
      fetchMessages(selectedConv);
      const interval = setInterval(() => fetchMessages(selectedConv), 3000);
      return () => clearInterval(interval);
    } else {
      setMessages([]);
    }
  }, [selectedConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConv || isSending) return;

    const token = typeof window !== "undefined" ? window.localStorage.getItem("admin-token") : null;
    setIsSending(true);
    try {
      const res = await axios.post(`${getApiUrl()}/chat`, {
        message: newMessage,
        conversationId: selectedConv
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success) {
        setNewMessage("");
        fetchMessages(selectedConv);
        fetchConversations();
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{
      display: "flex", height: "calc(100vh - 200px)", background: C.card,
      border: `1px solid ${C.border}`, borderRadius: 20, overflow: "hidden",
      boxShadow: "0 8px 32px rgba(0,0,0,0.2)"
    }}>
      {/* Conversations List (Left Pane) */}
      <div style={{ width: 320, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: 20, borderBottom: `1px solid ${C.border}`, background: "rgba(0,0,0,0.1)" }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.text, display: "flex", alignItems: "center", gap: 8 }}>
            <HeadphonesIcon size={18} color={C.primary} />
            Active Chats
          </h2>
        </div>
        
        <div style={{ flex: 1, overflowY: "auto", padding: 10 }}>
          {isLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Loader2 className="animate-spin" color={C.muted} /></div>
          ) : conversations.length === 0 ? (
            <p style={{ textAlign: "center", color: C.muted, fontSize: 13, marginTop: 40 }}>No active chats.</p>
          ) : (
            conversations.map(conv => (
              <div 
                key={conv.conversationId}
                onClick={() => setSelectedConv(conv.conversationId)}
                style={{
                  padding: 14, borderRadius: 12, cursor: "pointer",
                  background: selectedConv === conv.conversationId ? "rgba(124, 58, 237, 0.15)" : "transparent",
                  border: `1px solid ${selectedConv === conv.conversationId ? C.primary : "transparent"}`,
                  display: "flex", alignItems: "center", gap: 12, marginBottom: 4,
                  transition: "all 0.2s"
                }}
              >
                <div style={{ 
                  width: 40, height: 40, borderRadius: 20, background: C.faint, 
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 
                }}>
                  <UserCircle2 size={20} color={C.text} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {conv.userName}
                    </span>
                    {conv.unreadCount > 0 && (
                      <span style={{ background: C.primary, color: "#fff", fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 10 }}>
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", margin: 0 }}>
                    {conv.latestMessage.senderName}: {conv.latestMessage.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area (Right Pane) */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "rgba(0,0,0,0.15)" }}>
        {!selectedConv ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: C.muted }}>
            <HeadphonesIcon size={48} opacity={0.2} style={{ marginBottom: 16 }} />
            <p style={{ fontSize: 14, fontWeight: 600 }}>Select a conversation to start chatting</p>
          </div>
        ) : (
          <>
            <div style={{ padding: "16px 24px", borderBottom: `1px solid ${C.border}`, background: "rgba(0,0,0,0.2)" }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>
                {conversations.find(c => c.conversationId === selectedConv)?.userName || "Business"}
              </h3>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              {messages.map(msg => {
                const isAdmin = msg.senderName === "Admin";
                return (
                  <div key={msg._id} style={{ display: "flex", flexDirection: "column", alignItems: isAdmin ? "flex-end" : "flex-start" }}>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, maxWidth: "75%" }}>
                      {!isAdmin && (
                        <div style={{ width: 28, height: 28, borderRadius: 14, background: C.faint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <UserCircle2 size={14} color="#fff" />
                        </div>
                      )}
                      <div style={{
                        padding: "12px 16px",
                        background: isAdmin ? C.primary : C.card,
                        border: isAdmin ? "none" : `1px solid ${C.border}`,
                        color: isAdmin ? "#fff" : C.text,
                        borderRadius: 16,
                        borderBottomRightRadius: isAdmin ? 4 : 16,
                        borderBottomLeftRadius: !isAdmin ? 4 : 16,
                        fontSize: 14,
                        lineHeight: 1.5,
                        whiteSpace: "pre-wrap"
                      }}>
                        {msg.message}
                      </div>
                    </div>
                    <span style={{ fontSize: 10, color: C.muted, marginTop: 4, padding: "0 36px" }}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ padding: 20, borderTop: `1px solid ${C.border}`, background: C.card }}>
              <form onSubmit={handleSendMessage} style={{ display: "flex", gap: 12 }}>
                <input
                  type="text"
                  placeholder="Reply to business..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  disabled={isSending}
                  style={{
                    flex: 1, height: 48, borderRadius: 12, border: `1px solid ${C.border}`,
                    background: C.bg, padding: "0 16px", color: C.text, fontSize: 14,
                    outline: "none"
                  }}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isSending}
                  style={{
                    height: 48, padding: "0 24px", borderRadius: 12, background: C.primary,
                    border: "none", color: "#fff", fontWeight: 700, fontSize: 14,
                    display: "flex", alignItems: "center", gap: 8, cursor: newMessage.trim() && !isSending ? "pointer" : "not-allowed",
                    opacity: newMessage.trim() && !isSending ? 1 : 0.5
                  }}
                >
                  {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Send
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
