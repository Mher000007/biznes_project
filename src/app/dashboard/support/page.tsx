"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { useI18n } from "@/i18n";
import { Send, HeadphonesIcon, Loader2, Camera, Smile, X, Paperclip, Image as ImageIcon } from "lucide-react";

export default function SupportChatPage() {
  const { t } = useI18n();
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [attachment, setAttachment] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't focus if user is already typing in another input/textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      // If the key is a printable character (length 1) and no modifier keys are pressed
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAttachment(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !attachment) || !currentUser || isSending) return;

    setIsSending(true);
    try {
      const res = await api.post("/chat", {
        message: newMessage,
        conversationId: currentUser.id,
        attachments: attachment ? [attachment] : []
      });

      if (res.data?.success) {
        setNewMessage("");
        setAttachment(null);
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
            messages.map((msg: any, index: number) => {
              const msgDate = new Date(msg.createdAt).toLocaleDateString();
              const prevMsgDate = index > 0 ? new Date(messages[index - 1].createdAt).toLocaleDateString() : null;
              const showDate = msgDate !== prevMsgDate;

              const isAdmin = msg.senderName === "Admin";
              return (
                <div key={msg._id} className="flex flex-col w-full">
                  {showDate && (
                    <div className="flex justify-center my-4 w-full">
                      <span className="text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))]/50 px-3 py-1 rounded-full">
                        {new Date(msg.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                  <div className={`flex flex-col ${!isAdmin ? "items-end" : "items-start"}`}>
                    <div className="flex items-end gap-2 max-w-[80%]">
                      {isAdmin && (
                        <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center shrink-0">
                          <span className="text-white text-xs font-bold">A</span>
                        </div>
                      )}
                      <div
                        className={`px-4 py-3 rounded-2xl ${!isAdmin
                          ? "bg-[hsl(var(--primary))] !text-white rounded-br-sm"
                          : "bg-[hsl(var(--muted))] !text-white rounded-bl-sm"
                          }`}
                      >
                        {msg.attachments?.map((att: string, i: number) => {
                           if (att.startsWith('data:image')) {
                              return <img key={i} src={att} alt="Attachment" className="max-w-full h-auto rounded-xl mb-2 max-h-48 object-cover" />;
                           }
                           return null;
                        })}
                        {msg.message && <p className="text-sm !text-white whitespace-pre-wrap" style={{ color: "#ffffff" }}>{msg.message}</p>}
                      </div>
                    </div>
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1 mx-10">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Attachment Preview */}
        {attachment && (
          <div className="p-4 bg-[hsl(var(--muted))]/10 border-t border-[hsl(var(--border))] flex items-start gap-4">
            <div className="relative inline-block">
              <img src={attachment} alt="Preview" className="w-20 h-20 object-cover rounded-xl border border-[hsl(var(--border))]" />
              <button 
                type="button"
                onClick={() => setAttachment(null)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Chat Input */}
        <div className="p-4 bg-[hsl(var(--muted))]/30 border-t border-[hsl(var(--border))]">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileSelect} 
            />
            <input 
              type="file" 
              accept="image/*" 
              capture="environment"
              ref={cameraInputRef} 
              className="hidden" 
              onChange={handleFileSelect} 
            />
            
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors cursor-pointer"
              >
                <Smile className="w-5 h-5" />
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-12 left-0 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl shadow-lg p-2 grid grid-cols-5 gap-2 z-50">
                   {['😀','😂','🥺','❤️','👍','🙏','🔥','🎉','🚀','😅','😍','😎','✨','💡','✅'].map(emoji => (
                     <button
                       key={emoji}
                       type="button"
                       className="w-8 h-8 flex items-center justify-center hover:bg-[hsl(var(--muted))] rounded-lg cursor-pointer"
                       onClick={() => {
                         setNewMessage(prev => prev + emoji);
                         setShowEmojiPicker(false);
                         inputRef.current?.focus();
                       }}
                     >
                       {emoji}
                     </button>
                   ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                className="p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors cursor-pointer"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              {showAttachMenu && (
                <div className="absolute bottom-12 left-0 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl shadow-lg p-2 w-56 z-50 flex flex-col gap-1">
                  <button
                    type="button"
                    className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-[hsl(var(--muted))] rounded-lg cursor-pointer w-full text-left text-[hsl(var(--foreground))]"
                    onClick={() => {
                      setShowAttachMenu(false);
                      cameraInputRef.current?.click();
                    }}
                  >
                    <Camera className="w-4 h-4 text-[hsl(var(--primary))]" />
                    {(t.dashboard.supportPage as any).takePhoto || "Հիմա նկարել"}
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-[hsl(var(--muted))] rounded-lg cursor-pointer w-full text-left text-[hsl(var(--foreground))]"
                    onClick={() => {
                      setShowAttachMenu(false);
                      fileInputRef.current?.click();
                    }}
                  >
                    <ImageIcon className="w-4 h-4 text-emerald-500" />
                    {(t.dashboard.supportPage as any).uploadFromComputer || "Համակարգչից ներբեռնել"}
                  </button>
                </div>
              )}
            </div>

            <input
              ref={inputRef}
              type="text"
              placeholder={(t.dashboard.supportPage as any).typeYourMessage || "Type your message..."}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={isSending}
              className="flex-1 h-12 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/30 focus:border-[hsl(var(--primary))]"
            />
            <button
              type="submit"
              disabled={(!newMessage.trim() && !attachment) || isSending}
              className="h-12 px-6 bg-[hsl(var(--primary))] !text-white rounded-xl font-medium text-sm flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
              style={{ color: "#ffffff" }}
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Send className="h-4 w-4 text-white" />}
              <span className="!text-white" style={{ color: "#ffffff" }}>{(t.dashboard.supportPage as any).send || "Send"}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
