import React, { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import { Bell, Check, Info } from "lucide-react";

interface Notification {
  _id: string;
  title: string;
  message: string;
  readBy: string[];
  createdAt: string;
}

export default function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setUserId(u._id || u.id);
      } catch (e) {}
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      if (res.data?.success) {
        setNotifications(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  useEffect(() => {
    if (userId) {
      loadNotifications();
      // Poll every minute
      const interval = setInterval(loadNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  const markAsRead = async (id: string) => {
    if (!userId) return;
    try {
      await api.put(`/notifications/${id}/read`, {});
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, readBy: [...n.readBy, userId] } : n)
      );
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const unreadCount = notifications.filter(n => userId && !n.readBy.includes(userId)).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => { setOpen(!open); if (!open) loadNotifications(); }}
        className="relative p-2 rounded-full hover:bg-[hsl(var(--accent))] transition-colors"
      >
        <Bell size={20} className="text-[hsl(var(--foreground))]" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-[5px] py-[1px] rounded-full min-w-[16px] text-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-[400px] overflow-y-auto bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-4 border-b border-[hsl(var(--border))] sticky top-0 bg-[hsl(var(--card))] z-10">
            <h3 className="font-bold text-sm text-[hsl(var(--foreground))]">Notifications</h3>
          </div>
          
          <div className="divide-y divide-[hsl(var(--border))]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-[hsl(var(--muted-foreground))] flex flex-col items-center gap-2">
                <Bell size={24} className="opacity-20" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => {
                const isUnread = userId && !n.readBy.includes(userId);
                return (
                  <div 
                    key={n._id} 
                    className={`p-4 transition-colors ${isUnread ? 'bg-[hsl(var(--primary))/5]' : 'hover:bg-[hsl(var(--accent))/50]'}`}
                    onClick={() => isUnread && markAsRead(n._id)}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isUnread ? 'bg-[hsl(var(--primary))/20] text-[hsl(var(--primary))]' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'}`}>
                          {isUnread ? <Info size={14} /> : <Check size={14} />}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={`text-sm ${isUnread ? 'font-bold text-[hsl(var(--foreground))]' : 'font-medium text-[hsl(var(--foreground))/80]'}`}>
                            {n.title}
                          </h4>
                          <span className="text-[10px] text-[hsl(var(--muted-foreground))] whitespace-nowrap ml-2">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className={`text-xs ${isUnread ? 'text-[hsl(var(--foreground))/90]' : 'text-[hsl(var(--muted-foreground))]'}`}>
                          {n.message}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
