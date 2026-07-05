"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { getApiUrl } from "@/lib/utils";
import {
  BarChart3, Building2, CalendarDays, Gem, Flag, Users,
  Mail, Phone, Trash2, CheckCircle2,
  X, Ban, RefreshCw, LogOut, CheckCircle, AlertOctagon,
  UserCircle2, Crown, Briefcase, Star, Eye, Tag, Award,
  MessageSquare, Send, CheckSquare, Square
} from "lucide-react";

const API = getApiUrl();
const ADMIN_TOKEN_KEY = "admin-token";
const ADMIN_USER_KEY = "admin-user";

/* ── Dark theme color palette ── */
const C = {
  bg: "#1e1e2e",
  surface: "#252538",
  card: "#2a2a42",
  border: "rgba(255,255,255,0.09)",
  text: "#e8e8f8",
  muted: "rgba(220,220,255,0.55)",
  faint: "rgba(200,200,255,0.28)",
  violet: "#c4b5fd",
  violetDim: "rgba(167,139,250,0.22)",
  green: "#86efac",
  greenDim: "rgba(134,239,172,0.15)",
  amber: "#fcd34d",
  amberDim: "rgba(252,211,77,0.15)",
  red: "#fca5a5",
  redDim: "rgba(252,165,165,0.15)",
  sky: "#7dd3fc",
  pink: "#f9a8d4",
  emerald: "#6ee7b7",
  yellow: "#fde68a",
};



interface Business {
  _id: string; name: string; slug: string; email: string;
  phone?: string; city?: string; address?: string; description?: string;
  website?: string; verified: boolean; active: boolean;
  rating: number; reviewCount: number; views: number; createdAt: string;
  owner?: { name: string; email: string };
  category?: { name: string };
  gallery?: string[];
  operatingHours?: Array<{ day: string; open: string; close: string; closed: boolean }>;
}
interface Booking {
  _id: string; customerName: string; customerPhone: string;
  serviceName: string; date: string; timeSlot: string;
  status: "pending" | "confirmed" | "cancelled"; createdAt: string;
  business?: { name: string; slug: string };
}
interface Subscription {
  _id: string; plan: "starter" | "standard" | "premium";
  status: "active" | "expired" | "cancelled";
  startDate: string; endDate: string;
  business?: { _id: string; name: string; email: string; slug: string };
}
interface Review {
  _id: string; comment: string; rating: number;
  reportedReason?: string; reportedAt?: string; status: string;
  author?: { name: string; email: string };
  business?: { _id: string; name: string; slug: string; email?: string };
}
interface User {
  _id: string; name: string; username?: string; email: string;
  phone?: string; role: "user" | "business_owner" | "admin"; createdAt: string;
}
interface Stats {
  totalBusinesses: number; pendingBusinesses: number; verifiedBusinesses: number;
  totalBookings: number; confirmedBookings: number; cancelledBookings: number;
  activeSubscriptions: number; totalUsers: number; totalReviews: number;
  flaggedReviews: number; totalRevenue: number;
}
interface SubscriptionGift {
  _id: string;
  business: { _id: string; name: string; email: string; slug: string };
  plan: 'starter' | 'standard' | 'premium';
  durationValue: number;
  durationUnit: 'days' | 'months' | 'permanent';
  startDate: string;
  endDate: string;
  reason: string;
  giftedBy: { name: string; email: string };
  actionType: 'create' | 'extend' | 'overwrite';
  createdAt: string;
}

interface PromoCode {
  _id: string;
  code: string;
  plan: 'starter' | 'standard' | 'premium';
  discountType: 'percent' | 'amount' | 'free';
  discountValue: number;
  durationValue: number;
  durationUnit: 'days' | 'months' | 'permanent';
  maxUses?: number;
  usesCount: number;
  startDate?: string;
  expiryDate?: string;
  restrictedToBusinesses: Array<{ _id: string; name: string; slug: string }>;
  isActive: boolean;
  redemptions: Array<{
    business: string;
    user: string;
    redeemedAt: string;
  }>;
  createdAt: string;
}

type TabKey = "overview" | "businesses" | "bookings" | "subscriptions" | "reviews" | "users" | "promocodes" | "messages";

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem(ADMIN_TOKEN_KEY) : null;
}
function authHeaders() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

/* ─────────────── LOGIN SCREEN ─────────────── */
function AdminLogin({ onLogin }: { onLogin: (token: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await axios.post(`${API}/auth/login`, { email, password });
      if (res.data?.success) {
        const user = res.data.user;
        if (user?.role !== "admin") {
          setError("Access denied — admin credentials required.");
          setLoading(false); return;
        }
        localStorage.setItem(ADMIN_TOKEN_KEY, res.data.token);
        localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
        onLogin(res.data.token);
      } else {
        setError(res.data?.message || "Login failed.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid credentials.");
    }
    setLoading(false);
  };

  const inp: React.CSSProperties = {
    width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12, padding: "12px 16px", fontSize: 14, color: C.text,
    outline: "none", boxSizing: "border-box",
  };

  return (
    <div data-admin-panel="1" style={{
      minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center",
      justifyContent: "center", padding: 24
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <img src="/logo.png" alt="Findy Logo" style={{ height: "52px", objectFit: "contain" }} />
            <span style={{ fontSize: 22, fontWeight: 800, color: "#00E676", letterSpacing: "2.5px", textTransform: "uppercase" }}>
              Admin
            </span>
          </div>
          <p style={{ fontSize: 12, color: C.faint, marginTop: 6 }}>Restricted access — authorized personnel only</p>
        </div>

        {/* Card */}
        <div style={{
          background: C.surface, borderRadius: 20, padding: 28,
          border: `1px solid ${C.border}`, boxShadow: "0 24px 64px rgba(0,0,0,0.5)"
        }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{
                display: "block", fontSize: 11, fontWeight: 700, color: C.muted,
                letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8
              }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@armbiz.am" required style={inp} />
            </div>
            <div>
              <label style={{
                display: "block", fontSize: 11, fontWeight: 700, color: C.muted,
                letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8
              }}>Password</label>
              <div style={{ position: "relative" }}>
                <input type={showPw ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required style={{ ...inp, paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", color: C.faint, cursor: "pointer", padding: 0
                  }}>
                  {showPw ? <X size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                background: C.redDim, border: "1px solid rgba(248,113,113,0.25)",
                borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 8
              }}>
                <AlertOctagon size={16} color={C.red} style={{ flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: C.red, margin: 0 }}>{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{
                padding: "13px 0", borderRadius: 12, fontWeight: 700, fontSize: 14,
                color: "#fff", border: "none", cursor: loading ? "not-allowed" : "pointer",
                background: "linear-gradient(90deg,#7c3aed,#4f46e5)",
                boxShadow: "0 4px 20px rgba(124,58,237,0.35)",
                opacity: loading ? 0.65 : 1, transition: "opacity 0.2s"
              }}>
              {loading ? "Authenticating…" : "Access Portal"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── STAT CARD ─────────────── */
function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div style={{
      background: C.card, borderRadius: 16, padding: "20px 22px",
      border: `1px solid ${C.border}`
    }}>
      <p style={{
        fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase",
        letterSpacing: "0.08em", margin: "0 0 8px"
      }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 900, color, margin: 0 }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: C.faint, marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

/* ─────────────── ADMIN DASHBOARD ─────────────── */
function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<TabKey>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [bizSubTab, setBizSubTab] = useState<"pending" | "verified" | "all">("pending");
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [adminReply, setAdminReply] = useState("");
  const [resolveAction, setResolveAction] = useState<"keep" | "delete" | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [gifts, setGifts] = useState<SubscriptionGift[]>([]);
  const [promoSubTab, setPromoSubTab] = useState<"active" | "inactive" | "all">("active");
  const [planSubTab, setPlanSubTab] = useState<"subscriptions" | "gifts">("subscriptions");

  // Gifting subscription state
  const [giftModalOpen, setGiftModalOpen] = useState(false);
  const [giftingBusiness, setGiftingBusiness] = useState<Business | null>(null);
  const [giftPlan, setGiftPlan] = useState<'starter' | 'standard' | 'premium'>('standard');
  const [giftDurationValue, setGiftDurationValue] = useState(1);
  const [giftDurationUnit, setGiftDurationUnit] = useState<'days' | 'months' | 'permanent'>('months');
  const [giftReason, setGiftReason] = useState("");
  const [giftActionType, setGiftActionType] = useState<'extend' | 'overwrite'>('overwrite');
  const [giftingInProgress, setGiftingInProgress] = useState(false);
  const [giftError, setGiftError] = useState("");

  // Promo code creation state
  const [createPromoModalOpen, setCreatePromoModalOpen] = useState(false);
  const [newPromoCode, setNewPromoCode] = useState("");
  const [newPromoPlan, setNewPromoPlan] = useState<'starter' | 'standard' | 'premium'>('standard');
  const [newPromoDiscountType, setNewPromoDiscountType] = useState<'percent' | 'amount' | 'free'>('free');
  const [newPromoDiscountValue, setNewPromoDiscountValue] = useState(0);
  const [newPromoDurationValue, setNewPromoDurationValue] = useState(1);
  const [newPromoDurationUnit, setNewPromoDurationUnit] = useState<'days' | 'months' | 'permanent'>('months');
  const [newPromoMaxUses, setNewPromoMaxUses] = useState<number | ''>('');
  const [newPromoStartDate, setNewPromoStartDate] = useState("");
  const [newPromoExpiryDate, setNewPromoExpiryDate] = useState("");
  const [newPromoRestrictedBusinesses, setNewPromoRestrictedBusinesses] = useState<string[]>([]);
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState("");
  const [creatingPromo, setCreatingPromo] = useState(false);

  // Messaging state
  const [selectedMsgUsers, setSelectedMsgUsers] = useState<string[]>([]);
  const [msgModalOpen, setMsgModalOpen] = useState(false);
  const [msgTitle, setMsgTitle] = useState("");
  const [msgContent, setMsgContent] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [msgSuccess, setMsgSuccess] = useState("");
  const [msgError, setMsgError] = useState("");

  const load = useCallback(async () => {
    setLoadingData(true);
    try {
      const h = authHeaders();
      const [statsRes, bizRes, bookRes, subRes, revRes, usersRes, promosRes, giftsRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, { headers: h }),
        axios.get(`${API}/admin/businesses`, { headers: h }),
        axios.get(`${API}/admin/bookings`, { headers: h }),
        axios.get(`${API}/admin/subscriptions`, { headers: h }),
        axios.get(`${API}/admin/reports`, { headers: h }),
        axios.get(`${API}/admin/users`, { headers: h }),
        axios.get(`${API}/admin/promos`, { headers: h }),
        axios.get(`${API}/admin/gifts`, { headers: h }),
      ]);
      if (statsRes.data?.success) setStats(statsRes.data.data);
      if (bizRes.data?.success) setBusinesses(bizRes.data.data);
      if (bookRes.data?.success) setBookings(bookRes.data.data);
      if (subRes.data?.success) setSubscriptions(subRes.data.data);
      if (revRes.data?.success) setReviews(revRes.data.data);
      if (usersRes.data?.success) setAllUsers(usersRes.data.data);
      if (promosRes.data?.success) setPromos(promosRes.data.data);
      if (giftsRes.data?.success) setGifts(giftsRes.data.data);
    } catch (err) {
      console.error("Admin data load failed:", err);
    }
    setLoadingData(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const approveBiz = async (id: string) => {
    await axios.put(`${API}/admin/businesses/${id}/approve`, {}, { headers: authHeaders() }); load();
  };
  const rejectBiz = async (id: string) => {
    if (!confirm("Suspend this business?")) return;
    await axios.put(`${API}/admin/businesses/${id}/reject`, {}, { headers: authHeaders() }); load();
  };
  const deleteBiz = async (id: string) => {
    if (!confirm("Permanently delete this business and all its data?")) return;
    await axios.delete(`${API}/admin/businesses/${id}`, { headers: authHeaders() }); load();
  };
  const deleteBook = async (id: string) => {
    if (!confirm("Delete this booking?")) return;
    await axios.delete(`${API}/admin/bookings/${id}`, { headers: authHeaders() }); load();
  };
  const deleteSub = async (id: string) => {
    if (!confirm("Delete this subscription?")) return;
    await axios.delete(`${API}/admin/subscriptions/${id}`, { headers: authHeaders() }); load();
  };
  const deleteUserById = async (id: string) => {
    if (!confirm("Permanently delete this user account?")) return;
    await axios.delete(`${API}/admin/users/${id}`, { headers: authHeaders() }); load();
  };

  const handleGiftSubscriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftingBusiness) return;
    setGiftingInProgress(true);
    setGiftError("");
    try {
      const res = await axios.post(
        `${API}/admin/businesses/${giftingBusiness._id}/gift`,
        {
          plan: giftPlan,
          durationValue: giftDurationValue,
          durationUnit: giftDurationUnit,
          reason: giftReason,
          actionType: giftActionType,
        },
        { headers: authHeaders() }
      );
      if (res.data?.success) {
        setGiftModalOpen(false);
        setGiftingBusiness(null);
        setGiftReason("");
        setGiftPlan("standard");
        setGiftDurationValue(1);
        setGiftDurationUnit("months");
        load();
      }
    } catch (err: any) {
      setGiftError(err.response?.data?.message || "Failed to gift subscription");
    } finally {
      setGiftingInProgress(false);
    }
  };

  const handleCreatePromoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingPromo(true);
    setPromoError("");
    setPromoSuccess("");
    try {
      const res = await axios.post(
        `${API}/admin/promos`,
        {
          code: newPromoCode,
          plan: newPromoPlan,
          discountType: newPromoDiscountType,
          discountValue: newPromoDiscountValue,
          durationValue: newPromoDurationValue,
          durationUnit: newPromoDurationUnit,
          maxUses: newPromoMaxUses || null,
          startDate: newPromoStartDate || null,
          expiryDate: newPromoExpiryDate || null,
          restrictedToBusinesses: newPromoRestrictedBusinesses,
        },
        { headers: authHeaders() }
      );
      if (res.data?.success) {
        setPromoSuccess("Promo code created successfully!");
        setNewPromoCode("");
        setNewPromoPlan("standard");
        setNewPromoDiscountType("free");
        setNewPromoDiscountValue(0);
        setNewPromoDurationValue(1);
        setNewPromoDurationUnit("months");
        setNewPromoMaxUses("");
        setNewPromoStartDate("");
        setNewPromoExpiryDate("");
        setNewPromoRestrictedBusinesses([]);
        setTimeout(() => {
          setCreatePromoModalOpen(false);
          setPromoSuccess("");
        }, 1500);
        load();
      }
    } catch (err: any) {
      setPromoError(err.response?.data?.message || "Failed to create promo code");
    } finally {
      setCreatingPromo(false);
    }
  };

  const handleTogglePromo = async (id: string) => {
    try {
      await axios.put(`${API}/admin/promos/${id}/toggle`, {}, { headers: authHeaders() });
      load();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to toggle promo code status");
    }
  };

  const handleDeletePromo = async (id: string) => {
    if (!confirm("Are you sure you want to delete this promo code?")) return;
    try {
      await axios.delete(`${API}/admin/promos/${id}`, { headers: authHeaders() });
      load();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete promo code");
    }
  };

  const handleSendMsg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgTitle.trim() || !msgContent.trim() || selectedMsgUsers.length === 0) return;
    
    setSendingMsg(true);
    setMsgError("");
    setMsgSuccess("");
    try {
      const res = await axios.post(
        `${API}/admin/notifications/send`,
        { title: msgTitle, message: msgContent, userIds: selectedMsgUsers },
        { headers: authHeaders() }
      );
      if (res.data?.success) {
        setMsgSuccess("Message sent successfully!");
        setTimeout(() => {
          setMsgSuccess("");
          setMsgTitle("");
          setMsgContent("");
          setSelectedMsgUsers([]);
        }, 1500);
      }
    } catch (err: any) {
      setMsgError(err.response?.data?.message || "Failed to send message");
    } finally {
      setSendingMsg(false);
    }
  };

  const toggleMsgUser = (id: string) => {
    setSelectedMsgUsers(prev => prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]);
  };
  
  const toggleAllMsgUsers = () => {
    if (selectedMsgUsers.includes('all')) {
      setSelectedMsgUsers([]);
    } else {
      setSelectedMsgUsers(['all']);
    }
  };

  const generatePromoCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPromoCode(result);
  };

  const submitResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingId || !resolveAction || adminReply.trim().length < 5) return;
    await axios.put(`${API}/admin/reports/${resolvingId}/resolve`,
      { action: resolveAction, adminReply: adminReply.trim() }, { headers: authHeaders() });
    setResolvingId(null); setAdminReply(""); setResolveAction(null); load();
  };

  const filteredBiz = businesses.filter(b => {
    if (bizSubTab === "pending") return !b.verified;
    if (bizSubTab === "verified") return b.verified;
    return true;
  });

  type TabDef = { key: TabKey; label: string; Icon: React.ElementType };
  const tabs: TabDef[] = [
    { key: "overview", label: "Overview", Icon: BarChart3 },
    { key: "businesses", label: "Businesses", Icon: Building2 },
    { key: "bookings", label: "Bookings", Icon: CalendarDays },
    { key: "subscriptions", label: "Plans", Icon: Gem },
    { key: "reviews", label: "Reports", Icon: Flag },
    { key: "users", label: "Users", Icon: Users },
    { key: "promocodes", label: "Promo Codes", Icon: Tag },
    { key: "messages", label: "Messages", Icon: MessageSquare },
  ];

  const tabBtn = (t: TabDef) => {
    const active = tab === t.key;
    return (
      <button key={t.key} onClick={() => setTab(t.key)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "8px 14px", borderRadius: 10, border: "none", cursor: "pointer",
          fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0,
          background: active ? C.violetDim : "rgba(255,255,255,0.05)",
          color: active ? C.violet : C.text,
          transition: "all 0.15s"
        }}>
        <t.Icon size={14} />
        {t.label}
        {t.key === "businesses" && stats?.pendingBusinesses ? (
          <span style={{
            background: C.amber, color: "#1a1a1a", fontSize: 9, fontWeight: 800,
            padding: "2px 6px", borderRadius: 99
          }}>{stats.pendingBusinesses}</span>
        ) : null}
        {t.key === "reviews" && stats?.flaggedReviews ? (
          <span style={{
            background: C.red, color: "#fff", fontSize: 9, fontWeight: 800,
            padding: "2px 6px", borderRadius: 99
          }}>{stats.flaggedReviews}</span>
        ) : null}
        {t.key === "users" && allUsers.length > 0 ? (
          <span style={{
            background: "#7c3aed", color: "#fff", fontSize: 9, fontWeight: 800,
            padding: "2px 6px", borderRadius: 99
          }}>{allUsers.length}</span>
        ) : null}
      </button>
    );
  };

  const btnSm = (label: string, onClick: () => void, color: string, dim: string, icon?: React.ReactNode) => (
    <button onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
        borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700,
        background: color, color: "#fff", transition: "opacity 0.15s"
      }}
      onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
      onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
      {icon}{label}
    </button>
  );

  const iconBtn = (onClick: () => void, icon: React.ReactNode, color: string, dim: string, title?: string) => (
    <button onClick={onClick} title={title}
      style={{
        background: dim, border: "none", color, padding: 8, borderRadius: 8,
        cursor: "pointer", display: "flex", transition: "opacity 0.15s"
      }}
      onMouseEnter={e => (e.currentTarget.style.opacity = "0.75")}
      onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
      {icon}
    </button>
  );

  const sectionHead = (title: string, sub: string) => (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: C.text, margin: 0 }}>{title}</h2>
      <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{sub}</p>
    </div>
  );

  const emptyState = (Icon: React.ElementType, msg: string) => (
    <div style={{
      textAlign: "center", padding: "64px 0", background: C.card,
      borderRadius: 16, border: `1px solid ${C.border}`
    }}>
      <Icon size={40} color={C.faint} style={{ marginBottom: 12 }} />
      <p style={{ fontSize: 14, fontWeight: 600, color: C.muted }}>{msg}</p>
    </div>
  );

  return (
    <div data-admin-panel="1" style={{
      minHeight: "100vh", background: C.bg, color: C.text, display: "flex", flexDirection: "column",
      colorScheme: "dark"
    }}>
      <style>{`
        html, body, main { background: ${C.bg} !important; color: ${C.text} !important; color-scheme: dark; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: rgba(167,139,250,0.3); border-radius: 4px; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        /* Hide Navbar/Footer/ChatWidget on admin page */
        body.admin-dark > main > *:not([data-admin-panel]) { display: none !important; }
      `}</style>

      {/* ── TOP BAR ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: C.bg, borderBottom: `1px solid ${C.border}`,
        backdropFilter: "blur(12px)"
      }}>
        <div style={{
          maxWidth: 1280, margin: "0 auto", padding: "0 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between", height: 52
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/logo.png" alt="Findy Logo" style={{ height: "34px", objectFit: "contain" }} />
            <span style={{ fontSize: 15, fontWeight: 800, color: "#00E676", letterSpacing: "1.5px", textTransform: "uppercase" }}>
              Admin
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {loadingData && <RefreshCw size={14} color={C.violet} style={{ animation: "spin 1s linear infinite" }} />}
            <button onClick={load}
              style={{
                padding: 7, borderRadius: 8, background: "rgba(255,255,255,0.06)",
                border: "none", color: C.muted, cursor: "pointer"
              }}
              title="Refresh">
              <RefreshCw size={14} />
            </button>
            <button onClick={onLogout}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
                borderRadius: 8, background: "none", border: "none", color: C.muted,
                cursor: "pointer", fontSize: 12, fontWeight: 600
              }}>
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>
      </header>

      {/* ── TAB NAV ── */}
      <nav style={{
        position: "sticky", top: 52, zIndex: 40,
        background: C.surface, borderBottom: `1px solid ${C.border}`
      }}>
        <div style={{
          maxWidth: 1280, margin: "0 auto", padding: "8px 16px",
          display: "flex", gap: 4, overflowX: "auto",
          scrollbarWidth: "none", msOverflowStyle: "none"
        } as React.CSSProperties}>
          {tabs.map(tabBtn)}
        </div>
      </nav>

      {/* ── CONTENT ── */}
      <main style={{
        flex: 1, maxWidth: 1280, width: "100%", margin: "0 auto",
        padding: "24px 24px 64px"
      }}>

        {/* OVERVIEW */}
        {tab === "overview" && stats && (
          <div>
            {sectionHead("Platform Overview", "Live statistics across all registered businesses and users.")}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 16 }}>
              <StatCard label="Total Businesses" value={stats.totalBusinesses} sub={`${stats.verifiedBusinesses} verified`} color={C.violet} />
              <StatCard label="Pending Approval" value={stats.pendingBusinesses} sub="Awaiting review" color={C.amber} />
              <StatCard label="Total Bookings" value={stats.totalBookings} sub={`${stats.confirmedBookings} confirmed`} color={C.emerald} />
              <StatCard label="Active Plans" value={stats.activeSubscriptions} sub="Subscriptions" color={C.sky} />
              <StatCard label="Total Users" value={stats.totalUsers} sub="Registered accounts" color={C.pink} />
              <StatCard label="Reviews" value={stats.totalReviews} sub={`${stats.flaggedReviews} flagged`} color="#fb923c" />
              <StatCard label="Revenue (AMD)" value={`֏${stats.totalRevenue.toLocaleString()}`} sub="Active subscriptions" color={C.yellow} />
              <StatCard label="Cancelled Bookings" value={stats.cancelledBookings} color={C.red} />
            </div>
          </div>
        )}

        {/* BUSINESSES */}
        {tab === "businesses" && (
          <div>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexWrap: "wrap", gap: 12, marginBottom: 20
            }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: C.text, margin: 0 }}>Businesses</h2>
                <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Review, verify, and moderate registered businesses.</p>
              </div>
              <div style={{
                display: "flex", background: "rgba(255,255,255,0.05)",
                borderRadius: 10, padding: 4, gap: 2
              }}>
                {(["pending", "verified", "all"] as const).map(m => (
                  <button key={m} onClick={() => setBizSubTab(m)}
                    style={{
                      padding: "5px 14px", borderRadius: 7, border: "none",
                      cursor: "pointer", fontSize: 12, fontWeight: 700,
                      textTransform: "capitalize",
                      background: bizSubTab === m ? "rgba(255,255,255,0.1)" : "transparent",
                      color: bizSubTab === m ? C.text : C.muted,
                      transition: "all 0.15s"
                    }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            {filteredBiz.length === 0 ? emptyState(Building2, "No businesses found") : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {filteredBiz.map(b => (
                  <div key={b._id} style={{
                    background: C.card, borderRadius: 16, padding: 20,
                    border: `1px solid ${C.border}`, display: "flex",
                    justifyContent: "space-between", alignItems: "center",
                    flexWrap: "wrap", gap: 16
                  }}>
                    <div onClick={() => setSelectedBusiness(b)} style={{ cursor: "pointer", flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{b.name}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                          background: b.verified ? C.greenDim : C.amberDim,
                          color: b.verified ? C.green : C.amber
                        }}>
                          {b.verified ? "Verified" : "Pending"}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: C.muted, margin: "6px 0 0" }}>
                        {b.category?.name || "No Category"} • {b.city}
                      </p>
                      <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
                        <span style={{
                          display: "flex", alignItems: "center", gap: 4,
                          fontSize: 12, color: C.muted
                        }}>
                          <Mail size={13} />{b.email}
                        </span>
                        {b.phone && <span style={{
                          display: "flex", alignItems: "center", gap: 4,
                          fontSize: 12, color: C.muted
                        }}>
                          <Phone size={13} />{b.phone}
                        </span>}
                        <span style={{
                          display: "flex", alignItems: "center", gap: 4,
                          fontSize: 12, color: C.amber
                        }}>
                          <Star size={13} fill={C.amber} />{b.rating.toFixed(1)} ({b.reviewCount})
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {!b.verified
                        ? btnSm("Approve", () => approveBiz(b._id), "#16a34a", C.greenDim, <CheckCircle2 size={13} />)
                        : btnSm("Suspend", () => rejectBiz(b._id), "#b45309", C.amberDim, <Ban size={13} />)
                      }
                      {btnSm("Gift Plan", () => {
                        setGiftingBusiness(b);
                        const hasActive = subscriptions.some(s => s.business?._id === b._id && s.plan !== 'starter' && s.status === 'active' && new Date(s.endDate) > new Date());
                        setGiftActionType(hasActive ? 'extend' : 'overwrite');
                        setGiftError("");
                        setGiftModalOpen(true);
                      }, "#7c3aed", C.violetDim, <Award size={13} />)}
                      {btnSm("Delete", () => deleteBiz(b._id), "#dc2626", C.redDim, <Trash2 size={13} />)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* BOOKINGS */}
        {tab === "bookings" && (
          <div>
            {sectionHead("Bookings", "View and remove registered appointments across the platform.")}
            {bookings.length === 0 ? emptyState(CalendarDays, "No bookings registered") : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {bookings.map(bk => (
                  <div key={bk._id} style={{
                    background: C.card, borderRadius: 16, padding: 20,
                    border: `1px solid ${C.border}`, display: "flex",
                    justifyContent: "space-between", alignItems: "center", gap: 16
                  }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{bk.serviceName}</span>
                      <p style={{ fontSize: 12, color: C.muted, margin: "4px 0 0" }}>
                        at {bk.business?.name || "Business"} • {bk.customerName} ({bk.customerPhone})
                      </p>
                      <p style={{
                        fontSize: 12, color: C.muted, margin: "4px 0 0",
                        display: "flex", alignItems: "center", gap: 4
                      }}>
                        <CalendarDays size={12} /> {bk.date} @ {bk.timeSlot}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 800, padding: "3px 10px",
                        borderRadius: 99, textTransform: "uppercase",
                        background: bk.status === "confirmed" ? C.greenDim
                          : bk.status === "cancelled" ? C.redDim : C.amberDim,
                        color: bk.status === "confirmed" ? C.green
                          : bk.status === "cancelled" ? C.red : C.amber
                      }}>
                        {bk.status}
                      </span>
                      {iconBtn(() => deleteBook(bk._id), <Trash2 size={14} />, C.red, C.redDim, "Delete booking")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "subscriptions" && (
          <div>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              flexWrap: "wrap", gap: 12, marginBottom: 20
            }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: C.text, margin: 0 }}>Subscription Plans</h2>
                <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Track active billing details, premium tiers, and direct gifts.</p>
              </div>
              <div style={{
                display: "flex", background: "rgba(255,255,255,0.05)",
                borderRadius: 10, padding: 4, gap: 2
              }}>
                <button onClick={() => setPlanSubTab("subscriptions")}
                  style={{
                    padding: "5px 14px", borderRadius: 7, border: "none",
                    cursor: "pointer", fontSize: 12, fontWeight: 700,
                    background: planSubTab === "subscriptions" ? "rgba(255,255,255,0.1)" : "transparent",
                    color: planSubTab === "subscriptions" ? C.text : C.muted,
                    transition: "all 0.15s"
                  }}>
                  Active Subscriptions
                </button>
                <button onClick={() => setPlanSubTab("gifts")}
                  style={{
                    padding: "5px 14px", borderRadius: 7, border: "none",
                    cursor: "pointer", fontSize: 12, fontWeight: 700,
                    background: planSubTab === "gifts" ? "rgba(255,255,255,0.1)" : "transparent",
                    color: planSubTab === "gifts" ? C.text : C.muted,
                    transition: "all 0.15s"
                  }}>
                  Gift History ({gifts.length})
                </button>
              </div>
            </div>

            {planSubTab === "subscriptions" ? (
              subscriptions.length === 0 ? emptyState(Gem, "No active subscriptions") : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {subscriptions.map(s => (
                    <div key={s._id} style={{
                      background: C.card, borderRadius: 16, padding: 20,
                      border: `1px solid ${C.border}`, display: "flex",
                      justifyContent: "space-between", alignItems: "center", gap: 16
                    }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: 14, color: C.text, textTransform: "capitalize" }}>
                          {s.plan} Plan
                        </span>
                        <p style={{ fontSize: 12, color: C.muted, margin: "4px 0 0" }}>
                          Business: {s.business?.name || "—"} ({s.business?.email})
                        </p>
                        <p style={{
                          fontSize: 12, color: C.muted, margin: "4px 0 0",
                          display: "flex", alignItems: "center", gap: 4
                        }}>
                          <CalendarDays size={12} />
                          {new Date(s.startDate).toLocaleDateString()} → {new Date(s.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 99,
                          textTransform: "uppercase",
                          background: s.status === "active" ? C.greenDim : C.redDim,
                          color: s.status === "active" ? C.green : C.red
                        }}>
                          {s.status}
                        </span>
                        {iconBtn(() => deleteSub(s._id), <Trash2 size={14} />, C.red, C.redDim, "Cancel subscription")}
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              gifts.length === 0 ? emptyState(Award, "No subscription gifts recorded") : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {gifts.map(g => (
                    <div key={g._id} style={{
                      background: C.card, borderRadius: 16, padding: 20,
                      border: `1px solid ${C.border}`, display: "flex",
                      justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap"
                    }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: C.text, textTransform: "capitalize" }}>
                            {g.plan} Gift
                          </span>
                          <span style={{
                            fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 99,
                            background: g.actionType === 'extend' ? C.sky + "22" : g.actionType === 'overwrite' ? C.redDim : C.greenDim,
                            color: g.actionType === 'extend' ? C.sky : g.actionType === 'overwrite' ? C.red : C.green,
                            textTransform: "uppercase"
                          }}>
                            {g.actionType}
                          </span>
                        </div>
                        <p style={{ fontSize: 12, color: C.text, margin: "6px 0 0" }}>
                          Business: <strong style={{ color: C.violet }}>{g.business?.name || "—"}</strong> ({g.business?.email})
                        </p>
                        <p style={{ fontSize: 12, color: C.muted, margin: "4px 0 0" }}>
                          <strong>Reason:</strong> &ldquo;{g.reason}&rdquo;
                        </p>
                        <p style={{ fontSize: 11, color: C.faint, margin: "6px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
                          <CalendarDays size={11} />
                          Validity: {new Date(g.startDate).toLocaleDateString()} → {g.durationUnit === 'permanent' ? 'Lifetime' : new Date(g.endDate).toLocaleDateString()}
                          {g.durationUnit !== 'permanent' && ` (${g.durationValue} ${g.durationUnit})`}
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>Gifted by:</p>
                        <p style={{ fontSize: 12, fontWeight: 700, color: C.text, margin: 0 }}>{g.giftedBy?.name || "Admin"}</p>
                        <p style={{ fontSize: 11, color: C.faint, margin: 0 }}>{g.giftedBy?.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}

        {/* REPORTS / REVIEWS */}
        {tab === "reviews" && (
          <div>
            {sectionHead("Review Moderation", "Inspect flagged reviews and respond to business owner report appeals.")}
            {reviews.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "64px 0", background: C.card,
                borderRadius: 16, border: `1px solid ${C.border}`
              }}>
                <CheckCircle size={40} color={C.green} style={{ marginBottom: 12 }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: C.muted }}>Queue is clear!</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {reviews.map(r => (
                  <div key={r._id} style={{
                    background: C.card, borderRadius: 16, padding: 24,
                    border: `1px solid ${C.border}`
                  }}>
                    <div style={{
                      display: "flex", justifyContent: "space-between",
                      flexWrap: "wrap", gap: 16, marginBottom: 16
                    }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 12, color: C.muted }}>Flagged on:</span>
                          <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{r.business?.name}</span>
                          <span style={{
                            fontSize: 11, color: C.red, background: C.redDim,
                            padding: "2px 8px", borderRadius: 99
                          }}>Reported</span>
                        </div>
                        <div style={{
                          display: "flex", alignItems: "center", gap: 8, marginTop: 6,
                          fontSize: 12, color: C.muted
                        }}>
                          <span>By: <strong style={{ color: C.text }}>{r.author?.name || "Anonymous"}</strong></span>
                          <span>•</span>
                          <span style={{ color: C.amber }}>Rating: {r.rating} ★</span>
                          {r.reportedAt && (
                            <><span>•</span><span>Date: {new Date(r.reportedAt).toLocaleDateString()}</span></>
                          )}
                        </div>
                      </div>
                      {resolvingId !== r._id && (
                        <div style={{ display: "flex", gap: 8 }}>
                          {btnSm("Keep Review", () => { setResolvingId(r._id); setResolveAction("keep"); }, "#16a34a", C.greenDim)}
                          {btnSm("Delete Review", () => { setResolvingId(r._id); setResolveAction("delete"); }, "#dc2626", C.redDim)}
                        </div>
                      )}
                    </div>

                    <div style={{
                      display: "grid", gridTemplateColumns: "1fr 1fr",
                      gap: 16, marginBottom: resolvingId === r._id ? 20 : 0
                    }}>
                      <div style={{ background: "rgba(255,255,255,0.04)", padding: 14, borderRadius: 10 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: C.muted,
                          textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6
                        }}>
                          Review Content
                        </span>
                        <p style={{ fontSize: 13, color: C.text, fontStyle: "italic", margin: 0 }}>
                          &ldquo;{r.comment}&rdquo;
                        </p>
                      </div>
                      <div style={{ background: C.redDim, padding: 14, borderRadius: 10 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: C.red,
                          textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6
                        }}>
                          Report Reason
                        </span>
                        <p style={{ fontSize: 13, color: C.text, margin: 0 }}>
                          {r.reportedReason || "Inappropriate content"}
                        </p>
                      </div>
                    </div>

                    {resolvingId === r._id && (
                      <form onSubmit={submitResolve}
                        style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20, marginTop: 4 }}>
                        <div style={{ background: "rgba(255,255,255,0.04)", padding: 16, borderRadius: 12 }}>
                          <h4 style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: "0 0 8px" }}>
                            {resolveAction === "delete" ? "Delete Review & Reply" : "Keep Review & Reply"}
                          </h4>
                          <p style={{ fontSize: 12, color: C.muted, margin: "0 0 12px" }}>
                            Provide a message explaining the decision. Notification will be sent to the business owner.
                          </p>
                          <textarea value={adminReply} onChange={e => setAdminReply(e.target.value)}
                            placeholder="Explain your decision…" rows={3} required
                            style={{
                              width: "100%", background: C.bg, border: `1px solid ${C.border}`,
                              borderRadius: 8, padding: 12, fontSize: 12, color: C.text,
                              outline: "none", resize: "vertical", boxSizing: "border-box"
                            }} />
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
                            <button type="button"
                              onClick={() => { setResolvingId(null); setResolveAction(null); }}
                              style={{
                                padding: "7px 14px", borderRadius: 8, border: "none",
                                background: "rgba(255,255,255,0.06)", color: C.muted,
                                cursor: "pointer", fontSize: 12, fontWeight: 600
                              }}>
                              Cancel
                            </button>
                            <button type="submit"
                              style={{
                                padding: "7px 14px", borderRadius: 8, border: "none",
                                background: resolveAction === "delete" ? "#dc2626" : "#16a34a",
                                color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700
                              }}>
                              Submit Resolution
                            </button>
                          </div>
                        </div>
                      </form>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* USERS */}
        {tab === "users" && (
          <div>
            {sectionHead("All Users", "View and moderate all registered users.")}
            {allUsers.length === 0 ? emptyState(Users, "No registered users found") : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {allUsers.map(u => {
                  const isAdmin = u.role === "admin";
                  const Icon = isAdmin ? Crown : u.role === "business_owner" ? Briefcase : UserCircle2;
                  const badgeColor = isAdmin ? C.violet : u.role === "business_owner" ? C.sky : C.muted;
                  const badgeDim = isAdmin ? C.violetDim : u.role === "business_owner" ? "rgba(56,189,248,0.12)" : "rgba(255,255,255,0.06)";
                  return (
                    <div key={u._id} style={{
                      background: C.card, borderRadius: 16, padding: 18,
                      border: `1px solid ${C.border}`, display: "flex",
                      justifyContent: "space-between", alignItems: "center", gap: 16
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: 10,
                          background: "rgba(255,255,255,0.06)", display: "flex",
                          alignItems: "center", justifyContent: "center", flexShrink: 0
                        }}>
                          <Icon size={16} color={C.muted} />
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{u.name}</span>
                            {u.username && <span style={{ fontSize: 12, color: C.muted }}>@{u.username}</span>}
                          </div>
                          <p style={{ fontSize: 12, color: C.muted, margin: "3px 0 0" }}>
                            {u.email} • Joined {new Date(u.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 800, padding: "3px 10px",
                          borderRadius: 99, background: badgeDim, color: badgeColor,
                          textTransform: "uppercase"
                        }}>
                          {u.role.replace("_", " ")}
                        </span>
                        {!isAdmin && iconBtn(() => deleteUserById(u._id), <Trash2 size={14} />, C.red, C.redDim, "Delete user")}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MESSAGES */}
        {tab === "messages" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            {/* Header Section */}
            <form onSubmit={handleSendMsg} style={{
              background: `linear-gradient(135deg, ${C.card} 0%, rgba(124, 58, 237, 0.1) 100%)`,
              borderRadius: 20, padding: 24, marginBottom: 24,
              border: `1px solid ${C.border}`, boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              display: "flex", flexDirection: "column", gap: 20
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 900, color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
                    <MessageSquare size={22} color={C.violet} />
                    Messaging Hub
                  </h2>
                  <p style={{ fontSize: 13, color: C.muted, marginTop: 6, maxWidth: 500, lineHeight: 1.5 }}>
                    Select users below to send direct notifications. Broadcast system updates or targeted messages directly to their in-app inbox.
                  </p>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <button type="button" onClick={toggleAllMsgUsers} style={{
                      display: "flex", alignItems: "center", gap: 8, 
                      background: selectedMsgUsers.includes('all') ? "rgba(124, 58, 237, 0.15)" : "rgba(255,255,255,0.05)",
                      border: `1px solid ${selectedMsgUsers.includes('all') ? C.violet : C.border}`, 
                      borderRadius: 12, padding: "10px 16px", color: selectedMsgUsers.includes('all') ? C.violet : C.text, 
                      cursor: "pointer", transition: "all 0.2s", fontWeight: 700, fontSize: 13
                    }}>
                      {selectedMsgUsers.includes('all') ? <CheckSquare size={16} /> : <Square size={16} />}
                      Select All Users
                    </button>

                    <button 
                      type="submit"
                      disabled={selectedMsgUsers.length === 0 || sendingMsg}
                      style={{
                        padding: "10px 20px", borderRadius: 12, 
                        background: selectedMsgUsers.length > 0 ? "linear-gradient(135deg, #7c3aed, #4f46e5)" : "rgba(255,255,255,0.1)",
                        border: "none", color: selectedMsgUsers.length > 0 ? "#fff" : C.muted,
                        cursor: selectedMsgUsers.length > 0 && !sendingMsg ? "pointer" : "not-allowed",
                        fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", gap: 8,
                        boxShadow: selectedMsgUsers.length > 0 ? "0 4px 12px rgba(124, 58, 237, 0.4)" : "none",
                        transition: "all 0.2s", opacity: sendingMsg ? 0.7 : 1
                      }}
                    >
                      <Send size={15} />
                      {sendingMsg ? "Sending..." : "Send"}
                    </button>
                  </div>
                  
                  {selectedMsgUsers.length > 0 && (
                    <span style={{ fontSize: 12, color: C.green, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                      <CheckCircle2 size={14} />
                      {selectedMsgUsers.includes('all') ? 'All Users' : `${selectedMsgUsers.length} User(s)`} Selected
                    </span>
                  )}
                </div>
              </div>

              {msgError && <div style={{ background: C.redDim, color: C.red, padding: "10px 14px", borderRadius: 10, fontSize: 13, border: `1px solid ${C.red}` }}>{msgError}</div>}
              {msgSuccess && <div style={{ background: C.greenDim, color: C.green, padding: "10px 14px", borderRadius: 10, fontSize: 13, border: `1px solid ${C.green}` }}>{msgSuccess}</div>}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.faint, marginBottom: 6 }}>Notification Title</label>
                  <input 
                    type="text" required value={msgTitle} onChange={e => setMsgTitle(e.target.value)}
                    style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", color: C.text, fontSize: 14 }}
                    placeholder="E.g., System Update"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.faint, marginBottom: 6 }}>Message Content</label>
                  <input 
                    type="text" required value={msgContent} onChange={e => setMsgContent(e.target.value)}
                    style={{ width: "100%", background: "rgba(0,0,0,0.2)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", color: C.text, fontSize: 14 }}
                    placeholder="Type your message here..."
                  />
                </div>
              </div>
            </form>

            {/* Users List */}
            {allUsers.length === 0 ? emptyState(Users, "No users available") : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
                {allUsers.map(u => {
                  const isSelected = selectedMsgUsers.includes('all') || selectedMsgUsers.includes(u._id);
                  const Icon = u.role === "admin" ? Crown : u.role === "business_owner" ? Briefcase : UserCircle2;
                  const badgeColor = u.role === "admin" ? C.violet : u.role === "business_owner" ? C.sky : C.muted;
                  const badgeBg = u.role === "admin" ? C.violetDim : u.role === "business_owner" ? "rgba(56,189,248,0.12)" : "rgba(255,255,255,0.06)";
                  
                  return (
                    <div key={u._id} 
                      onClick={() => !selectedMsgUsers.includes('all') && toggleMsgUser(u._id)}
                      style={{
                      background: isSelected ? "linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(124, 58, 237, 0.02))" : C.surface, 
                      borderRadius: 16, padding: "16px 20px",
                      border: `1px solid ${isSelected ? C.violet : C.border}`, display: "flex",
                      alignItems: "center", gap: 16,
                      cursor: selectedMsgUsers.includes('all') ? "default" : "pointer",
                      boxShadow: isSelected ? "0 4px 20px rgba(124, 58, 237, 0.15)" : "0 2px 8px rgba(0,0,0,0.2)",
                      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      transform: isSelected && !selectedMsgUsers.includes('all') ? "translateY(-2px)" : "none"
                    }}>
                      <div style={{ 
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.2s transform"
                      }}>
                         {isSelected ? <CheckSquare size={20} color={C.violet} /> : <Square size={20} color={C.muted} />}
                      </div>

                      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 12,
                          background: isSelected ? C.violetDim : "rgba(255,255,255,0.06)", 
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                          transition: "all 0.2s"
                        }}>
                          <Icon size={18} color={isSelected ? C.violet : C.muted} />
                        </div>
                        <div style={{ overflow: "hidden" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontWeight: 800, fontSize: 14, color: isSelected ? "#fff" : C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {u.name}
                            </span>
                          </div>
                          <p style={{ fontSize: 12, color: C.muted, margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {u.email}
                          </p>
                          <div style={{ marginTop: 6 }}>
                            <span style={{
                              fontSize: 9, fontWeight: 800, padding: "2px 8px",
                              borderRadius: 99, background: badgeBg, color: badgeColor,
                              textTransform: "uppercase", letterSpacing: "0.5px"
                            }}>
                              {u.role.replace("_", " ")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PROMO CODES */}
        {tab === "promocodes" && (
          <div>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexWrap: "wrap", gap: 12, marginBottom: 20
            }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: C.text, margin: 0 }}>Promo Codes</h2>
                <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Generate and manage promotional discount codes for businesses.</p>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{
                  display: "flex", background: "rgba(255,255,255,0.05)",
                  borderRadius: 10, padding: 4, gap: 2
                }}>
                  {(["active", "inactive", "all"] as const).map(m => (
                    <button key={m} onClick={() => setPromoSubTab(m)}
                      style={{
                        padding: "5px 14px", borderRadius: 7, border: "none",
                        cursor: "pointer", fontSize: 12, fontWeight: 700,
                        textTransform: "capitalize",
                        background: promoSubTab === m ? "rgba(255,255,255,0.1)" : "transparent",
                        color: promoSubTab === m ? C.text : C.muted,
                        transition: "all 0.15s"
                      }}>
                      {m}
                    </button>
                  ))}
                </div>
                {btnSm("Create Promo", () => {
                  setPromoError("");
                  setPromoSuccess("");
                  setCreatePromoModalOpen(true);
                }, "#16a34a", C.greenDim, <Tag size={13} />)}
              </div>
            </div>

            {promos.length === 0 ? emptyState(Tag, "No promo codes created yet") : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {promos
                  .filter(p => {
                    if (promoSubTab === "active") return p.isActive;
                    if (promoSubTab === "inactive") return !p.isActive;
                    return true;
                  })
                  .map(p => {
                    const isExpired = p.expiryDate && new Date(p.expiryDate) < new Date();
                    const isLimitReached = p.maxUses && p.usesCount >= p.maxUses;
                    const statusText = !p.isActive ? "Inactive" : isExpired ? "Expired" : isLimitReached ? "Used Up" : "Active";
                    const statusColor = statusText === "Active" ? C.green : statusText === "Inactive" ? C.muted : C.red;
                    const statusBg = statusText === "Active" ? C.greenDim : statusText === "Inactive" ? "rgba(255,255,255,0.06)" : C.redDim;

                    return (
                      <div key={p._id} style={{
                        background: C.card, borderRadius: 16, padding: 20,
                        border: `1px solid ${C.border}`, display: "flex",
                        justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap"
                      }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 16, fontWeight: 900, color: C.text, letterSpacing: "0.5px" }}>
                              {p.code}
                            </span>
                            <span style={{
                              fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 99,
                              background: statusBg, color: statusColor, textTransform: "uppercase"
                            }}>
                              {statusText}
                            </span>
                            <span style={{
                              fontSize: 11, color: C.violet, background: C.violetDim,
                              padding: "2px 8px", borderRadius: 99, textTransform: "capitalize"
                            }}>
                              Target: {p.plan} Plan
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap", fontSize: 12 }}>
                            <span style={{ color: C.text }}>
                              <strong>Benefit: </strong>
                              {p.discountType === 'free' ? '100% Free' : p.discountType === 'percent' ? `${p.discountValue}% Off` : `֏${p.discountValue.toLocaleString()} Off`}
                            </span>
                            <span style={{ color: C.muted }}>•</span>
                            <span style={{ color: C.text }}>
                              <strong>Duration: </strong>
                              {p.durationUnit === 'permanent' ? 'Lifetime' : `${p.durationValue} ${p.durationUnit}`}
                            </span>
                            <span style={{ color: C.muted }}>•</span>
                            <span style={{ color: C.text }}>
                              <strong>Redemptions: </strong>
                              {p.usesCount} {p.maxUses ? `/ ${p.maxUses}` : '(Unlimited)'}
                            </span>
                          </div>
                          {(p.startDate || p.expiryDate || (p.restrictedToBusinesses && p.restrictedToBusinesses.length > 0)) && (
                            <div style={{ display: "flex", gap: 12, marginTop: 6, flexWrap: "wrap", fontSize: 11, color: C.faint }}>
                              {(p.startDate || p.expiryDate) && (
                                <span>
                                  Validity: {p.startDate ? new Date(p.startDate).toLocaleDateString() : '—'} &rarr; {p.expiryDate ? new Date(p.expiryDate).toLocaleDateString() : '—'}
                                </span>
                              )}
                              {p.restrictedToBusinesses && p.restrictedToBusinesses.length > 0 && (
                                <span>
                                  • Restricted to: {p.restrictedToBusinesses.map(b => b.name).join(', ')}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          {btnSm(p.isActive ? "Deactivate" : "Activate", () => handleTogglePromo(p._id), p.isActive ? "#b45309" : "#16a34a", p.isActive ? C.amberDim : C.greenDim)}
                          {btnSm("Delete", () => handleDeletePromo(p._id), "#dc2626", C.redDim, <Trash2 size={13} />)}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

      </main>

      {/* ── GIFT SUBSCRIPTION MODAL ── */}
      {giftModalOpen && giftingBusiness && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
          background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20
        }}>
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20,
            width: "100%", maxWidth: 500, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.6)"
          }}>

            {/* Modal Header */}
            <div style={{
              padding: "18px 24px", borderBottom: `1px solid ${C.border}`,
              display: "flex", alignItems: "center", justifyContent: "space-between"
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: C.text, margin: 0 }}>Gift Subscription Plan</h3>
              <button onClick={() => { setGiftModalOpen(false); setGiftingBusiness(null); }}
                style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleGiftSubscriptionSubmit} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <p style={{ fontSize: 13, color: C.muted, margin: "0 0 4px" }}>Gifting subscription plan to:</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: C.violet, margin: 0 }}>{giftingBusiness.name} ({giftingBusiness.email})</p>
              </div>

              {/* Plan Selection */}
              <div>
                <label style={{
                  display: "block", fontSize: 11, fontWeight: 700, color: C.muted,
                  textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6
                }}>Target Plan</label>
                <select value={giftPlan} onChange={e => setGiftPlan(e.target.value as any)}
                  style={{
                    width: "100%", background: C.card, border: `1px solid ${C.border}`,
                    borderRadius: 10, padding: 10, fontSize: 13, color: C.text, outline: "none"
                  }}>
                  <option value="starter">Starter Plan (Freemium)</option>
                  <option value="standard">Standard Plan (֏20,000 / mo)</option>
                  <option value="premium">Premium Plan (֏50,000 / mo)</option>
                </select>
              </div>

              {/* Duration selection */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{
                    display: "block", fontSize: 11, fontWeight: 700, color: C.muted,
                    textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6
                  }}>Duration</label>
                  <input type="number" min={1} disabled={giftDurationUnit === 'permanent'}
                    value={giftDurationUnit === 'permanent' ? '' : giftDurationValue}
                    onChange={e => setGiftDurationValue(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{
                      width: "100%", background: C.card, border: `1px solid ${C.border}`,
                      borderRadius: 10, padding: 10, fontSize: 13, color: C.text, outline: "none", boxSizing: "border-box"
                    }} />
                </div>
                <div>
                  <label style={{
                    display: "block", fontSize: 11, fontWeight: 700, color: C.muted,
                    textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6
                  }}>Unit</label>
                  <select value={giftDurationUnit} onChange={e => setGiftDurationUnit(e.target.value as any)}
                    style={{
                      width: "100%", background: C.card, border: `1px solid ${C.border}`,
                      borderRadius: 10, padding: 10, fontSize: 13, color: C.text, outline: "none"
                    }}>
                    <option value="days">Days</option>
                    <option value="months">Months</option>
                    <option value="permanent">Permanent (Lifetime)</option>
                  </select>
                </div>
              </div>

              {/* Conflict Action Type */}
              {subscriptions.some(s => s.business?._id === giftingBusiness._id && s.plan !== 'starter' && s.status === 'active' && new Date(s.endDate) > new Date()) && (
                <div style={{ background: C.amberDim, border: "1px solid rgba(252,211,77,0.25)", borderRadius: 12, padding: 14 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 10 }}>
                    <AlertOctagon size={16} color={C.amber} style={{ flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 12, color: C.amber, fontWeight: 600, margin: 0 }}>
                      This business already has an active paid subscription plan. Select action:
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 16 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.text, cursor: "pointer" }}>
                      <input type="radio" name="conflictAction" value="overwrite"
                        checked={giftActionType === 'overwrite'} onChange={() => setGiftActionType('overwrite')} />
                      Overwrite (Replace current plan)
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.text, cursor: "pointer" }}>
                      <input type="radio" name="conflictAction" value="extend"
                        checked={giftActionType === 'extend'} onChange={() => setGiftActionType('extend')} />
                      Extend (Add to end date)
                    </label>
                  </div>
                </div>
              )}

              {/* Internal Comment */}
              <div>
                <label style={{
                  display: "block", fontSize: 11, fontWeight: 700, color: C.muted,
                  textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6
                }}>Internal Comment / Reason</label>
                <textarea rows={3} value={giftReason} onChange={e => setGiftReason(e.target.value)} required
                  placeholder="Partnership deal, compensation, etc. (min 5 chars)"
                  style={{
                    width: "100%", background: C.card, border: `1px solid ${C.border}`,
                    borderRadius: 10, padding: 10, fontSize: 12, color: C.text, outline: "none", resize: "none", boxSizing: "border-box"
                  }} />
              </div>

              {giftError && (
                <div style={{ color: C.red, background: C.redDim, padding: 12, borderRadius: 10, fontSize: 12 }}>
                  {giftError}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, borderTop: `1px solid ${C.border}`, paddingTop: 16, marginTop: 4 }}>
                <button type="button" onClick={() => { setGiftModalOpen(false); setGiftingBusiness(null); }}
                  style={{
                    padding: "10px 16px", borderRadius: 10, background: "rgba(255,255,255,0.06)",
                    border: "none", color: C.text, cursor: "pointer", fontSize: 13, fontWeight: 600
                  }}>
                  Cancel
                </button>
                <button type="submit" disabled={giftingInProgress}
                  style={{
                    padding: "10px 18px", borderRadius: 10, background: "linear-gradient(90deg,#7c3aed,#4f46e5)",
                    border: "none", color: "#fff", cursor: giftingInProgress ? "not-allowed" : "pointer",
                    fontSize: 13, fontWeight: 700, opacity: giftingInProgress ? 0.7 : 1
                  }}>
                  {giftingInProgress ? "Gifting Plan..." : "Gift Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CREATE PROMO CODE MODAL ── */}
      {createPromoModalOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
          background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20
        }}>
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20,
            width: "100%", maxWidth: 540, overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column",
            boxShadow: "0 24px 64px rgba(0,0,0,0.6)"
          }}>

            {/* Modal Header */}
            <div style={{
              padding: "18px 24px", borderBottom: `1px solid ${C.border}`,
              display: "flex", alignItems: "center", justifyContent: "space-between"
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: C.text, margin: 0 }}>Create Promo Code</h3>
              <button onClick={() => setCreatePromoModalOpen(false)}
                style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreatePromoSubmit} style={{ padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Promo Code Code */}
              <div>
                <label style={{
                  display: "block", fontSize: 11, fontWeight: 700, color: C.muted,
                  textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6
                }}>Promo Code</label>
                <div style={{ display: "flex", gap: 10 }}>
                  <input type="text" placeholder="SUMMER2026" required value={newPromoCode}
                    onChange={e => setNewPromoCode(e.target.value.toUpperCase())}
                    style={{
                      flex: 1, background: C.card, border: `1px solid ${C.border}`,
                      borderRadius: 10, padding: 10, fontSize: 13, color: C.text, outline: "none"
                    }} />
                  <button type="button" onClick={generatePromoCode}
                    style={{
                      padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.06)",
                      border: "none", color: C.text, cursor: "pointer", fontSize: 12, fontWeight: 700
                    }}>
                    Generate
                  </button>
                </div>
              </div>

              {/* Plan Selection */}
              <div>
                <label style={{
                  display: "block", fontSize: 11, fontWeight: 700, color: C.muted,
                  textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6
                }}>Target Plan</label>
                <select value={newPromoPlan} onChange={e => setNewPromoPlan(e.target.value as any)}
                  style={{
                    width: "100%", background: C.card, border: `1px solid ${C.border}`,
                    borderRadius: 10, padding: 10, fontSize: 13, color: C.text, outline: "none"
                  }}>
                  <option value="starter">Starter Plan (Freemium)</option>
                  <option value="standard">Standard Plan</option>
                  <option value="premium">Premium Plan</option>
                </select>
              </div>

              {/* Discount Type */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{
                    display: "block", fontSize: 11, fontWeight: 700, color: C.muted,
                    textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6
                  }}>Discount Type</label>
                  <select value={newPromoDiscountType} onChange={e => setNewPromoDiscountType(e.target.value as any)}
                    style={{
                      width: "100%", background: C.card, border: `1px solid ${C.border}`,
                      borderRadius: 10, padding: 10, fontSize: 13, color: C.text, outline: "none"
                    }}>
                    <option value="free">100% Free Plan</option>
                    <option value="percent">Percentage Discount (%)</option>
                    <option value="amount">Fixed Amount Discount (AMD)</option>
                  </select>
                </div>
                {newPromoDiscountType !== 'free' && (
                  <div>
                    <label style={{
                      display: "block", fontSize: 11, fontWeight: 700, color: C.muted,
                      textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6
                    }}>Discount Value</label>
                    <input type="number" min={0} required value={newPromoDiscountValue}
                      onChange={e => setNewPromoDiscountValue(Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder={newPromoDiscountType === 'percent' ? "e.g. 20" : "e.g. 5000"}
                      style={{
                        width: "100%", background: C.card, border: `1px solid ${C.border}`,
                        borderRadius: 10, padding: 10, fontSize: 13, color: C.text, outline: "none", boxSizing: "border-box"
                      }} />
                  </div>
                )}
              </div>

              {/* Gift/Promo Duration */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{
                    display: "block", fontSize: 11, fontWeight: 700, color: C.muted,
                    textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6
                  }}>Validity Duration</label>
                  <input type="number" min={1} disabled={newPromoDurationUnit === 'permanent'}
                    value={newPromoDurationUnit === 'permanent' ? '' : newPromoDurationValue}
                    onChange={e => setNewPromoDurationValue(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{
                      width: "100%", background: C.card, border: `1px solid ${C.border}`,
                      borderRadius: 10, padding: 10, fontSize: 13, color: C.text, outline: "none", boxSizing: "border-box"
                    }} />
                </div>
                <div>
                  <label style={{
                    display: "block", fontSize: 11, fontWeight: 700, color: C.muted,
                    textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6
                  }}>Duration Unit</label>
                  <select value={newPromoDurationUnit} onChange={e => setNewPromoDurationUnit(e.target.value as any)}
                    style={{
                      width: "100%", background: C.card, border: `1px solid ${C.border}`,
                      borderRadius: 10, padding: 10, fontSize: 13, color: C.text, outline: "none"
                    }}>
                    <option value="days">Days</option>
                    <option value="months">Months</option>
                    <option value="permanent">Permanent (Lifetime)</option>
                  </select>
                </div>
              </div>

              {/* Max Uses */}
              <div>
                <label style={{
                  display: "block", fontSize: 11, fontWeight: 700, color: C.muted,
                  textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6
                }}>Usage Limit (Max Uses)</label>
                <input type="number" min={1} placeholder="e.g. 10 (Leave blank for unlimited)"
                  value={newPromoMaxUses} onChange={e => setNewPromoMaxUses(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 1))}
                  style={{
                    width: "100%", background: C.card, border: `1px solid ${C.border}`,
                    borderRadius: 10, padding: 10, fontSize: 13, color: C.text, outline: "none", boxSizing: "border-box"
                  }} />
              </div>

              {/* Dates */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{
                    display: "block", fontSize: 11, fontWeight: 700, color: C.muted,
                    textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6
                  }}>Start Date</label>
                  <input type="date" value={newPromoStartDate} onChange={e => setNewPromoStartDate(e.target.value)}
                    style={{
                      width: "100%", background: C.card, border: `1px solid ${C.border}`,
                      borderRadius: 10, padding: 10, fontSize: 13, color: C.text, outline: "none", boxSizing: "border-box"
                    }} />
                </div>
                <div>
                  <label style={{
                    display: "block", fontSize: 11, fontWeight: 700, color: C.muted,
                    textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6
                  }}>Expiry Date</label>
                  <input type="date" value={newPromoExpiryDate} onChange={e => setNewPromoExpiryDate(e.target.value)}
                    style={{
                      width: "100%", background: C.card, border: `1px solid ${C.border}`,
                      borderRadius: 10, padding: 10, fontSize: 13, color: C.text, outline: "none", boxSizing: "border-box"
                    }} />
                </div>
              </div>

              {/* Business Restrictions */}
              <div>
                <label style={{
                  display: "block", fontSize: 11, fontWeight: 700, color: C.muted,
                  textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6
                }}>Restrict to Specific Businesses</label>
                <select multiple value={newPromoRestrictedBusinesses}
                  onChange={e => {
                    const opts = Array.from(e.target.selectedOptions, option => option.value);
                    setNewPromoRestrictedBusinesses(opts);
                  }}
                  style={{
                    width: "100%", background: C.card, border: `1px solid ${C.border}`,
                    borderRadius: 10, padding: 8, fontSize: 12, color: C.text, outline: "none", height: 90
                  }}>
                  {businesses.map(b => (
                    <option key={b._id} value={b._id}>{b.name} ({b.city})</option>
                  ))}
                </select>
                <span style={{ fontSize: 10, color: C.faint, marginTop: 4, display: "block" }}>
                  Hold Ctrl (Windows) / Cmd (Mac) to select multiple specific businesses. If none selected, promo is open to all.
                </span>
              </div>

              {promoError && (
                <div style={{ color: C.red, background: C.redDim, padding: 12, borderRadius: 10, fontSize: 12 }}>
                  {promoError}
                </div>
              )}

              {promoSuccess && (
                <div style={{ color: C.green, background: C.greenDim, padding: 12, borderRadius: 10, fontSize: 12 }}>
                  {promoSuccess}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
                <button type="button" onClick={() => setCreatePromoModalOpen(false)}
                  style={{
                    padding: "10px 16px", borderRadius: 10, background: "rgba(255,255,255,0.06)",
                    border: "none", color: C.text, cursor: "pointer", fontSize: 13, fontWeight: 600
                  }}>
                  Cancel
                </button>
                <button type="submit" disabled={creatingPromo}
                  style={{
                    padding: "10px 18px", borderRadius: 10, background: "linear-gradient(90deg,#7c3aed,#4f46e5)",
                    border: "none", color: "#fff", cursor: creatingPromo ? "not-allowed" : "pointer",
                    fontSize: 13, fontWeight: 700, opacity: creatingPromo ? 0.7 : 1
                  }}>
                  {creatingPromo ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BUSINESS DETAILS MODAL */}
      {selectedBusiness && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999,
          background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20
        }}>
          <div style={{
            background: C.surface, borderRadius: 20, width: "100%", maxWidth: 650,
            maxHeight: "90vh", overflowY: "auto", border: `1px solid ${C.border}`,
            boxShadow: "0 24px 64px rgba(0,0,0,0.5)", position: "relative"
          }}>
            <button onClick={() => setSelectedBusiness(null)}
              style={{
                position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,0.1)",
                border: "none", borderRadius: "50%", padding: 6, color: C.text, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s"
              }}>
              <X size={18} />
            </button>
            <div style={{ padding: "32px 32px 24px", borderBottom: `1px solid ${C.border}` }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 8px", color: C.text }}>
                {selectedBusiness.name}
              </h2>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{
                  fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 99,
                  background: selectedBusiness.verified ? C.greenDim : C.amberDim,
                  color: selectedBusiness.verified ? C.green : C.amber, textTransform: "uppercase"
                }}>
                  {selectedBusiness.verified ? "Verified" : "Pending"}
                </span>
                <span style={{ fontSize: 13, color: C.muted }}>
                  {selectedBusiness.category?.name || "Uncategorized"}
                </span>
              </div>
            </div>

            <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <div>
                  <h3 style={{ fontSize: 12, textTransform: "uppercase", color: C.faint, marginBottom: 8, fontWeight: 700 }}>Contact Info</h3>
                  <p style={{ margin: "4px 0", fontSize: 14, color: C.text, display: "flex", alignItems: "center", gap: 6 }}><Mail size={14} /> {selectedBusiness.email || "N/A"}</p>
                  <p style={{ margin: "4px 0", fontSize: 14, color: C.text, display: "flex", alignItems: "center", gap: 6 }}><Phone size={14} /> {selectedBusiness.phone || "N/A"}</p>
                  <p style={{ margin: "4px 0", fontSize: 14, color: C.text, display: "flex", alignItems: "center", gap: 6 }}><Flag size={14} /> {selectedBusiness.city || "N/A"}</p>
                </div>
                <div>
                  <h3 style={{ fontSize: 12, textTransform: "uppercase", color: C.faint, marginBottom: 8, fontWeight: 700 }}>Owner Info</h3>
                  <p style={{ margin: "4px 0", fontSize: 14, color: C.text, display: "flex", alignItems: "center", gap: 6 }}><UserCircle2 size={14} /> {selectedBusiness.owner?.name || "N/A"}</p>
                  <p style={{ margin: "4px 0", fontSize: 14, color: C.text, display: "flex", alignItems: "center", gap: 6 }}><Mail size={14} /> {selectedBusiness.owner?.email || "N/A"}</p>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: 12, textTransform: "uppercase", color: C.faint, marginBottom: 8, fontWeight: 700 }}>Additional Data</h3>
                <div style={{ background: C.card, padding: 16, borderRadius: 12, border: `1px solid ${C.border}`, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                  <div>
                    <span style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 4 }}>RATING</span>
                    <strong style={{ fontSize: 16, color: C.amber }}>{selectedBusiness.rating?.toFixed(1) || 0}</strong> ({selectedBusiness.reviewCount || 0})
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 4 }}>TOTAL VIEWS</span>
                    <strong style={{ fontSize: 16, color: C.text }}>{selectedBusiness.views || 0}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: C.muted, display: "block", marginBottom: 4 }}>CREATED AT</span>
                    <strong style={{ fontSize: 14, color: C.text }}>{new Date(selectedBusiness.createdAt).toLocaleDateString()}</strong>
                  </div>
                </div>
              </div>

              {selectedBusiness.description && (
                <div>
                  <h3 style={{ fontSize: 12, textTransform: "uppercase", color: C.faint, marginBottom: 8, fontWeight: 700 }}>Description</h3>
                  <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.5, margin: 0 }}>
                    {selectedBusiness.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ─────────────── ROOT PAGE ─────────────── */
export default function AdminSecurePage() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) { setChecking(false); return; }
    axios
      .get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        const user = res.data?.user;
        if (user?.role === "admin") {
          setAuthed(true);
        } else {
          localStorage.removeItem(ADMIN_TOKEN_KEY);
          localStorage.removeItem(ADMIN_USER_KEY);
        }
      })
      .catch(() => {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        localStorage.removeItem(ADMIN_USER_KEY);
      })
      .finally(() => setChecking(false));
  }, []);

  const handleLogin = () => setAuthed(true);
  const handleLogout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
    setAuthed(false);
  };

  if (checking) {
    return (
      <div data-admin-panel="1" style={{
        minHeight: "100vh", background: "#1e1e2e",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <svg style={{
          width: 32, height: 32, color: "#c4b5fd",
          animation: "spin 1s linear infinite"
        }} fill="none" viewBox="0 0 24 24">
          <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!authed) return <AdminLogin onLogin={handleLogin} />;
  return <AdminDashboard onLogout={handleLogout} />;
}