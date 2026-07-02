"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { getApiUrl } from "@/lib/utils";
import {
  BarChart3, Building2, CalendarDays, Gem, Flag, Users,
  Mail, Phone, Trash2, CheckCircle2,
  X, Ban, RefreshCw, LogOut, CheckCircle, AlertOctagon,
  UserCircle2, Crown, Briefcase, Star, Eye,
} from "lucide-react";

const API = getApiUrl();
const ADMIN_TOKEN_KEY = "admin-token";
const ADMIN_USER_KEY = "admin-user";

/* ── Dark theme color palette ── */
const C = {
  bg:        "#1e1e2e",
  surface:   "#252538",
  card:      "#2a2a42",
  border:    "rgba(255,255,255,0.09)",
  text:      "#e8e8f8",
  muted:     "rgba(220,220,255,0.55)",
  faint:     "rgba(200,200,255,0.28)",
  violet:    "#c4b5fd",
  violetDim: "rgba(167,139,250,0.22)",
  green:     "#86efac",
  greenDim:  "rgba(134,239,172,0.15)",
  amber:     "#fcd34d",
  amberDim:  "rgba(252,211,77,0.15)",
  red:       "#fca5a5",
  redDim:    "rgba(252,165,165,0.15)",
  sky:       "#7dd3fc",
  pink:      "#f9a8d4",
  emerald:   "#6ee7b7",
  yellow:    "#fde68a",
};



interface Business {
  _id: string; name: string; slug: string; email: string;
  phone?: string; city?: string; verified: boolean; active: boolean;
  rating: number; reviewCount: number; views: number; createdAt: string;
  owner?: { name: string; email: string };
  category?: { name: string };
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
  business?: { name: string; email: string; slug: string };
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
type TabKey = "overview" | "businesses" | "bookings" | "subscriptions" | "reviews" | "users";

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem(ADMIN_TOKEN_KEY) : null;
}
function authHeaders() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

/* ─────────────── LOGIN SCREEN ─────────────── */
function AdminLogin({ onLogin }: { onLogin: (token: string) => void }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPw, setShowPw]     = useState(false);

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
    <div data-admin-panel="1" style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center",
      justifyContent: "center", padding: 24 }}>
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
        <div style={{ background: C.surface, borderRadius: 20, padding: 28,
          border: `1px solid ${C.border}`, boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.muted,
                letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@armbiz.am" required style={inp} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: C.muted,
                letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Password</label>
              <div style={{ position: "relative" }}>
                <input type={showPw ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required style={{ ...inp, paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", color: C.faint, cursor: "pointer", padding: 0 }}>
                  {showPw ? <X size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: C.redDim, border: "1px solid rgba(248,113,113,0.25)",
                borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                <AlertOctagon size={16} color={C.red} style={{ flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: C.red, margin: 0 }}>{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ padding: "13px 0", borderRadius: 12, fontWeight: 700, fontSize: 14,
                color: "#fff", border: "none", cursor: loading ? "not-allowed" : "pointer",
                background: "linear-gradient(90deg,#7c3aed,#4f46e5)",
                boxShadow: "0 4px 20px rgba(124,58,237,0.35)",
                opacity: loading ? 0.65 : 1, transition: "opacity 0.2s" }}>
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
    <div style={{ background: C.card, borderRadius: 16, padding: "20px 22px",
      border: `1px solid ${C.border}` }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase",
        letterSpacing: "0.08em", margin: "0 0 8px" }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 900, color, margin: 0 }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: C.faint, marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

/* ─────────────── ADMIN DASHBOARD ─────────────── */
function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab]                   = useState<TabKey>("overview");
  const [stats, setStats]               = useState<Stats | null>(null);
  const [businesses, setBusinesses]     = useState<Business[]>([]);
  const [bookings, setBookings]         = useState<Booking[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [reviews, setReviews]           = useState<Review[]>([]);
  const [allUsers, setAllUsers]         = useState<User[]>([]);
  const [loadingData, setLoadingData]   = useState(false);
  const [bizSubTab, setBizSubTab]       = useState<"pending" | "verified" | "all">("pending");
  const [resolvingId, setResolvingId]   = useState<string | null>(null);
  const [adminReply, setAdminReply]     = useState("");
  const [resolveAction, setResolveAction] = useState<"keep" | "delete" | null>(null);

  const load = useCallback(async () => {
    setLoadingData(true);
    try {
      const h = authHeaders();
      const [statsRes, bizRes, bookRes, subRes, revRes, usersRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, { headers: h }),
        axios.get(`${API}/admin/businesses`, { headers: h }),
        axios.get(`${API}/admin/bookings`, { headers: h }),
        axios.get(`${API}/admin/subscriptions`, { headers: h }),
        axios.get(`${API}/admin/reports`, { headers: h }),
        axios.get(`${API}/admin/users`, { headers: h }),
      ]);
      if (statsRes.data?.success)   setStats(statsRes.data.data);
      if (bizRes.data?.success)     setBusinesses(bizRes.data.data);
      if (bookRes.data?.success)    setBookings(bookRes.data.data);
      if (subRes.data?.success)     setSubscriptions(subRes.data.data);
      if (revRes.data?.success)     setReviews(revRes.data.data);
      if (usersRes.data?.success)   setAllUsers(usersRes.data.data);
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
  const submitResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingId || !resolveAction || adminReply.trim().length < 5) return;
    await axios.put(`${API}/admin/reports/${resolvingId}/resolve`,
      { action: resolveAction, adminReply: adminReply.trim() }, { headers: authHeaders() });
    setResolvingId(null); setAdminReply(""); setResolveAction(null); load();
  };

  const filteredBiz = businesses.filter(b => {
    if (bizSubTab === "pending")  return !b.verified;
    if (bizSubTab === "verified") return b.verified;
    return true;
  });

  type TabDef = { key: TabKey; label: string; Icon: React.ElementType };
  const tabs: TabDef[] = [
    { key: "overview",       label: "Overview",    Icon: BarChart3 },
    { key: "businesses",     label: "Businesses",  Icon: Building2 },
    { key: "bookings",       label: "Bookings",    Icon: CalendarDays },
    { key: "subscriptions",  label: "Plans",       Icon: Gem },
    { key: "reviews",        label: "Reports",     Icon: Flag },
    { key: "users",          label: "Users",       Icon: Users },
  ];

  const tabBtn = (t: TabDef) => {
    const active = tab === t.key;
    return (
      <button key={t.key} onClick={() => setTab(t.key)}
        style={{ display: "flex", alignItems: "center", gap: 6,
          padding: "8px 14px", borderRadius: 10, border: "none", cursor: "pointer",
          fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0,
          background: active ? C.violetDim : "rgba(255,255,255,0.05)",
          color: active ? C.violet : C.text,
          transition: "all 0.15s" }}>
        <t.Icon size={14} />
        {t.label}
        {t.key === "businesses" && stats?.pendingBusinesses ? (
          <span style={{ background: C.amber, color: "#1a1a1a", fontSize: 9, fontWeight: 800,
            padding: "2px 6px", borderRadius: 99 }}>{stats.pendingBusinesses}</span>
        ) : null}
        {t.key === "reviews" && stats?.flaggedReviews ? (
          <span style={{ background: C.red, color: "#fff", fontSize: 9, fontWeight: 800,
            padding: "2px 6px", borderRadius: 99 }}>{stats.flaggedReviews}</span>
        ) : null}
        {t.key === "users" && allUsers.length > 0 ? (
          <span style={{ background: "#7c3aed", color: "#fff", fontSize: 9, fontWeight: 800,
            padding: "2px 6px", borderRadius: 99 }}>{allUsers.length}</span>
        ) : null}
      </button>
    );
  };

  const btnSm = (label: string, onClick: () => void, color: string, dim: string, icon?: React.ReactNode) => (
    <button onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
        borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700,
        background: color, color: "#fff", transition: "opacity 0.15s" }}
      onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
      onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
      {icon}{label}
    </button>
  );

  const iconBtn = (onClick: () => void, icon: React.ReactNode, color: string, dim: string, title?: string) => (
    <button onClick={onClick} title={title}
      style={{ background: dim, border: "none", color, padding: 8, borderRadius: 8,
        cursor: "pointer", display: "flex", transition: "opacity 0.15s" }}
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
    <div style={{ textAlign: "center", padding: "64px 0", background: C.card,
      borderRadius: 16, border: `1px solid ${C.border}` }}>
      <Icon size={40} color={C.faint} style={{ marginBottom: 12 }} />
      <p style={{ fontSize: 14, fontWeight: 600, color: C.muted }}>{msg}</p>
    </div>
  );

  return (
    <div data-admin-panel="1" style={{ minHeight: "100vh", background: C.bg, color: C.text, display: "flex", flexDirection: "column",
      colorScheme: "dark" }}>
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
      <header style={{ position: "sticky", top: 0, zIndex: 50,
        background: C.bg, borderBottom: `1px solid ${C.border}`,
        backdropFilter: "blur(12px)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between", height: 52 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/logo.png" alt="Findy Logo" style={{ height: "34px", objectFit: "contain" }} />
            <span style={{ fontSize: 15, fontWeight: 800, color: "#00E676", letterSpacing: "1.5px", textTransform: "uppercase" }}>
              Admin
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {loadingData && <RefreshCw size={14} color={C.violet} style={{ animation: "spin 1s linear infinite" }} />}
            <button onClick={load}
              style={{ padding: 7, borderRadius: 8, background: "rgba(255,255,255,0.06)",
                border: "none", color: C.muted, cursor: "pointer" }}
              title="Refresh">
              <RefreshCw size={14} />
            </button>
            <button onClick={onLogout}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
                borderRadius: 8, background: "none", border: "none", color: C.muted,
                cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>
      </header>

      {/* ── TAB NAV ── */}
      <nav style={{ position: "sticky", top: 52, zIndex: 40,
        background: C.surface, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "8px 16px",
          display: "flex", gap: 4, overflowX: "auto",
          scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}>
          {tabs.map(tabBtn)}
        </div>
      </nav>

      {/* ── CONTENT ── */}
      <main style={{ flex: 1, maxWidth: 1280, width: "100%", margin: "0 auto",
        padding: "24px 24px 64px" }}>

        {/* OVERVIEW */}
        {tab === "overview" && stats && (
          <div>
            {sectionHead("Platform Overview", "Live statistics across all registered businesses and users.")}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 16 }}>
              <StatCard label="Total Businesses" value={stats.totalBusinesses} sub={`${stats.verifiedBusinesses} verified`} color={C.violet} />
              <StatCard label="Pending Approval" value={stats.pendingBusinesses} sub="Awaiting review" color={C.amber} />
              <StatCard label="Total Bookings"   value={stats.totalBookings}   sub={`${stats.confirmedBookings} confirmed`} color={C.emerald} />
              <StatCard label="Active Plans"     value={stats.activeSubscriptions} sub="Subscriptions" color={C.sky} />
              <StatCard label="Total Users"      value={stats.totalUsers}      sub="Registered accounts" color={C.pink} />
              <StatCard label="Reviews"          value={stats.totalReviews}    sub={`${stats.flaggedReviews} flagged`} color="#fb923c" />
              <StatCard label="Revenue (AMD)"    value={`֏${stats.totalRevenue.toLocaleString()}`} sub="Active subscriptions" color={C.yellow} />
              <StatCard label="Cancelled Bookings" value={stats.cancelledBookings} color={C.red} />
            </div>
          </div>
        )}

        {/* BUSINESSES */}
        {tab === "businesses" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
              flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: C.text, margin: 0 }}>Businesses</h2>
                <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Review, verify, and moderate registered businesses.</p>
              </div>
              <div style={{ display: "flex", background: "rgba(255,255,255,0.05)",
                borderRadius: 10, padding: 4, gap: 2 }}>
                {(["pending","verified","all"] as const).map(m => (
                  <button key={m} onClick={() => setBizSubTab(m)}
                    style={{ padding: "5px 14px", borderRadius: 7, border: "none",
                      cursor: "pointer", fontSize: 12, fontWeight: 700,
                      textTransform: "capitalize",
                      background: bizSubTab === m ? "rgba(255,255,255,0.1)" : "transparent",
                      color: bizSubTab === m ? C.text : C.muted,
                      transition: "all 0.15s" }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            {filteredBiz.length === 0 ? emptyState(Building2, "No businesses found") : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {filteredBiz.map(b => (
                  <div key={b._id} style={{ background: C.card, borderRadius: 16, padding: 20,
                    border: `1px solid ${C.border}`, display: "flex",
                    justifyContent: "space-between", alignItems: "center",
                    flexWrap: "wrap", gap: 16 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{b.name}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                          background: b.verified ? C.greenDim : C.amberDim,
                          color: b.verified ? C.green : C.amber }}>
                          {b.verified ? "Verified" : "Pending"}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: C.muted, margin: "6px 0 0" }}>
                        {b.category?.name || "No Category"} • {b.city}
                      </p>
                      <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4,
                          fontSize: 12, color: C.muted }}>
                          <Mail size={13} />{b.email}
                        </span>
                        {b.phone && <span style={{ display: "flex", alignItems: "center", gap: 4,
                          fontSize: 12, color: C.muted }}>
                          <Phone size={13} />{b.phone}
                        </span>}
                        <span style={{ display: "flex", alignItems: "center", gap: 4,
                          fontSize: 12, color: C.amber }}>
                          <Star size={13} fill={C.amber} />{b.rating.toFixed(1)} ({b.reviewCount})
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {!b.verified
                        ? btnSm("Approve", () => approveBiz(b._id), "#16a34a", C.greenDim, <CheckCircle2 size={13} />)
                        : btnSm("Suspend", () => rejectBiz(b._id),  "#b45309", C.amberDim, <Ban size={13} />)
                      }
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
                  <div key={bk._id} style={{ background: C.card, borderRadius: 16, padding: 20,
                    border: `1px solid ${C.border}`, display: "flex",
                    justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{bk.serviceName}</span>
                      <p style={{ fontSize: 12, color: C.muted, margin: "4px 0 0" }}>
                        at {bk.business?.name || "Business"} • {bk.customerName} ({bk.customerPhone})
                      </p>
                      <p style={{ fontSize: 12, color: C.muted, margin: "4px 0 0",
                        display: "flex", alignItems: "center", gap: 4 }}>
                        <CalendarDays size={12} /> {bk.date} @ {bk.timeSlot}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 10px",
                        borderRadius: 99, textTransform: "uppercase",
                        background: bk.status === "confirmed" ? C.greenDim
                          : bk.status === "cancelled" ? C.redDim : C.amberDim,
                        color: bk.status === "confirmed" ? C.green
                          : bk.status === "cancelled" ? C.red : C.amber }}>
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

        {/* SUBSCRIPTIONS */}
        {tab === "subscriptions" && (
          <div>
            {sectionHead("Subscription Plans", "Track active billing details and premium tiers.")}
            {subscriptions.length === 0 ? emptyState(Gem, "No active subscriptions") : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {subscriptions.map(s => (
                  <div key={s._id} style={{ background: C.card, borderRadius: 16, padding: 20,
                    border: `1px solid ${C.border}`, display: "flex",
                    justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 14, color: C.text, textTransform: "capitalize" }}>
                        {s.plan} Plan
                      </span>
                      <p style={{ fontSize: 12, color: C.muted, margin: "4px 0 0" }}>
                        Business: {s.business?.name || "—"} ({s.business?.email})
                      </p>
                      <p style={{ fontSize: 12, color: C.muted, margin: "4px 0 0",
                        display: "flex", alignItems: "center", gap: 4 }}>
                        <CalendarDays size={12} />
                        {new Date(s.startDate).toLocaleDateString()} → {new Date(s.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 99,
                        textTransform: "uppercase",
                        background: s.status === "active" ? C.greenDim : C.redDim,
                        color: s.status === "active" ? C.green : C.red }}>
                        {s.status}
                      </span>
                      {iconBtn(() => deleteSub(s._id), <Trash2 size={14} />, C.red, C.redDim, "Cancel subscription")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* REPORTS / REVIEWS */}
        {tab === "reviews" && (
          <div>
            {sectionHead("Review Moderation", "Inspect flagged reviews and respond to business owner report appeals.")}
            {reviews.length === 0 ? (
              <div style={{ textAlign: "center", padding: "64px 0", background: C.card,
                borderRadius: 16, border: `1px solid ${C.border}` }}>
                <CheckCircle size={40} color={C.green} style={{ marginBottom: 12 }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: C.muted }}>Queue is clear!</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {reviews.map(r => (
                  <div key={r._id} style={{ background: C.card, borderRadius: 16, padding: 24,
                    border: `1px solid ${C.border}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between",
                      flexWrap: "wrap", gap: 16, marginBottom: 16 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 12, color: C.muted }}>Flagged on:</span>
                          <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{r.business?.name}</span>
                          <span style={{ fontSize: 11, color: C.red, background: C.redDim,
                            padding: "2px 8px", borderRadius: 99 }}>Reported</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6,
                          fontSize: 12, color: C.muted }}>
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
                          {btnSm("Keep Review",   () => { setResolvingId(r._id); setResolveAction("keep");   }, "#16a34a", C.greenDim)}
                          {btnSm("Delete Review", () => { setResolvingId(r._id); setResolveAction("delete"); }, "#dc2626", C.redDim)}
                        </div>
                      )}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr",
                      gap: 16, marginBottom: resolvingId === r._id ? 20 : 0 }}>
                      <div style={{ background: "rgba(255,255,255,0.04)", padding: 14, borderRadius: 10 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: C.muted,
                          textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
                          Review Content
                        </span>
                        <p style={{ fontSize: 13, color: C.text, fontStyle: "italic", margin: 0 }}>
                          &ldquo;{r.comment}&rdquo;
                        </p>
                      </div>
                      <div style={{ background: C.redDim, padding: 14, borderRadius: 10 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: C.red,
                          textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
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
                            style={{ width: "100%", background: C.bg, border: `1px solid ${C.border}`,
                              borderRadius: 8, padding: 12, fontSize: 12, color: C.text,
                              outline: "none", resize: "vertical", boxSizing: "border-box" }} />
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
                            <button type="button"
                              onClick={() => { setResolvingId(null); setResolveAction(null); }}
                              style={{ padding: "7px 14px", borderRadius: 8, border: "none",
                                background: "rgba(255,255,255,0.06)", color: C.muted,
                                cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                              Cancel
                            </button>
                            <button type="submit"
                              style={{ padding: "7px 14px", borderRadius: 8, border: "none",
                                background: resolveAction === "delete" ? "#dc2626" : "#16a34a",
                                color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
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
                  const badgeDim   = isAdmin ? C.violetDim : u.role === "business_owner" ? "rgba(56,189,248,0.12)" : "rgba(255,255,255,0.06)";
                  return (
                    <div key={u._id} style={{ background: C.card, borderRadius: 16, padding: 18,
                      border: `1px solid ${C.border}`, display: "flex",
                      justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10,
                          background: "rgba(255,255,255,0.06)", display: "flex",
                          alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
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
                        <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 10px",
                          borderRadius: 99, background: badgeDim, color: badgeColor,
                          textTransform: "uppercase" }}>
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

      </main>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ─────────────── ROOT PAGE ─────────────── */
export default function AdminSecurePage() {
  const [authed, setAuthed]     = useState(false);
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

  const handleLogin  = () => setAuthed(true);
  const handleLogout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
    setAuthed(false);
  };

  if (checking) {
    return (
      <div data-admin-panel="1" style={{ minHeight: "100vh", background: "#1e1e2e",
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg style={{ width: 32, height: 32, color: "#c4b5fd",
          animation: "spin 1s linear infinite" }} fill="none" viewBox="0 0 24 24">
          <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!authed) return <AdminLogin onLogin={handleLogin} />;
  return <AdminDashboard onLogout={handleLogout} />;
}