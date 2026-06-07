"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { getApiUrl } from "@/lib/utils";
import {
  BarChart3, Building2, CalendarDays, Gem, Flag, Users,
  Mail, MapPin, Star, Eye, Phone, Trash2, CheckCircle2,
  X, Ban, RefreshCw, LogOut, CheckCircle, AlertOctagon, UserCircle2, Crown, Briefcase, Award
} from "lucide-react";

const API = getApiUrl();
const ADMIN_TOKEN_KEY = "admin-token";
const ADMIN_USER_KEY = "admin-user";

interface Business {
  _id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  city?: string;
  verified: boolean;
  active: boolean;
  rating: number;
  reviewCount: number;
  views: number;
  createdAt: string;
  owner?: { name: string; email: string };
  category?: { name: string };
}

interface Booking {
  _id: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  date: string;
  timeSlot: string;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
  business?: { name: string; slug: string };
}

interface Subscription {
  _id: string;
  plan: "starter" | "standard" | "premium";
  status: "active" | "expired" | "cancelled";
  startDate: string;
  endDate: string;
  business?: { name: string; email: string; slug: string };
}

interface Review {
  _id: string;
  comment: string;
  rating: number;
  reportedReason?: string;
  reportedAt?: string;
  status: string;
  author?: { name: string; email: string };
  business?: { _id: string; name: string; slug: string; email?: string };
}

interface User {
  _id: string;
  name: string;
  username?: string;
  email: string;
  phone?: string;
  role: "user" | "business_owner" | "admin";
  createdAt: string;
}

interface Stats {
  totalBusinesses: number;
  pendingBusinesses: number;
  verifiedBusinesses: number;
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  activeSubscriptions: number;
  totalUsers: number;
  totalReviews: number;
  flaggedReviews: number;
  totalRevenue: number;
}

type TabKey = "overview" | "businesses" | "bookings" | "subscriptions" | "reviews" | "users";

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem(ADMIN_TOKEN_KEY) : null;
}

function authHeaders() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// ─── LOGIN SCREEN ────────────────────────────────────────────────────────────
function AdminLogin({ onLogin }: { onLogin: (token: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API}/auth/login`, { email, password });
      if (res.data?.success) {
        const user = res.data.user;
        if (user?.role !== "admin") {
          setError("Access denied — admin credentials required.");
          setLoading(false);
          return;
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-[#1a1a1a] text-white px-4 pt-20 lg:pt-28 pb-12">
      <div className="relative w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/30 mb-4">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">arm<span className="gradient-text">biz</span> <span className="text-violet-400 font-semibold">Admin</span></h1>
          <p className="text-xs text-white/40 mt-1">Restricted access — authorized personnel only</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-2xl w-full border-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@armbiz.am"
                required
                className="w-full bg-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:bg-white/12 transition-all border-0"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white/8 rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-white/20 outline-none focus:bg-white/12 transition-all border-0"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPw ? <X className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3 flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/25 transition-all disabled:opacity-60 cursor-pointer border-0"
            >
              {loading ? "Authenticating..." : "Access Portal"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="bg-white/5 rounded-2xl p-4 sm:p-5 shadow-sm border-0">
      <p className="text-xs font-semibold text-white/40 mb-1 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl sm:text-3xl font-extrabold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-white/30 mt-1">{sub}</p>}
    </div>
  );
}

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

  // Moderation state
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [adminReply, setAdminReply] = useState("");
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
      if (statsRes.data?.success) setStats(statsRes.data.data);
      if (bizRes.data?.success) setBusinesses(bizRes.data.data);
      if (bookRes.data?.success) setBookings(bookRes.data.data);
      if (subRes.data?.success) setSubscriptions(subRes.data.data);
      if (revRes.data?.success) setReviews(revRes.data.data);
      if (usersRes.data?.success) setAllUsers(usersRes.data.data);
    } catch (err) {
      console.error("Admin data load failed:", err);
    }
    setLoadingData(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const approveBiz = async (id: string) => {
    await axios.put(`${API}/admin/businesses/${id}/approve`, {}, { headers: authHeaders() });
    load();
  };
  const rejectBiz = async (id: string) => {
    if (!confirm("Suspend this business?")) return;
    await axios.put(`${API}/admin/businesses/${id}/reject`, {}, { headers: authHeaders() });
    load();
  };
  const deleteBiz = async (id: string) => {
    if (!confirm("Permanently delete this business and all its data?")) return;
    await axios.delete(`${API}/admin/businesses/${id}`, { headers: authHeaders() });
    load();
  };
  const deleteBook = async (id: string) => {
    if (!confirm("Delete this booking?")) return;
    await axios.delete(`${API}/admin/bookings/${id}`, { headers: authHeaders() });
    load();
  };
  const deleteSub = async (id: string) => {
    if (!confirm("Delete this subscription?")) return;
    await axios.delete(`${API}/admin/subscriptions/${id}`, { headers: authHeaders() });
    load();
  };
  const deleteUserById = async (id: string) => {
    if (!confirm("Permanently delete this user account?")) return;
    await axios.delete(`${API}/admin/users/${id}`, { headers: authHeaders() });
    load();
  };
  const submitResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingId || !resolveAction || adminReply.trim().length < 5) return;
    await axios.put(`${API}/admin/reports/${resolvingId}/resolve`, {
      action: resolveAction,
      adminReply: adminReply.trim(),
    }, { headers: authHeaders() });
    setResolvingId(null);
    setAdminReply("");
    setResolveAction(null);
    load();
  };

  const filteredBiz = businesses.filter(b => {
    if (bizSubTab === "pending") return !b.verified;
    if (bizSubTab === "verified") return b.verified;
    return true;
  });

  type TabDef = { key: TabKey; label: string; Icon: React.ElementType };
  const tabs: TabDef[] = [
    { key: "overview",      label: "Overview",   Icon: BarChart3 },
    { key: "businesses",   label: "Businesses", Icon: Building2 },
    { key: "bookings",     label: "Bookings",   Icon: CalendarDays },
    { key: "subscriptions",label: "Plans",      Icon: Gem },
    { key: "reviews",      label: "Reports",    Icon: Flag },
    { key: "users",        label: "Users",      Icon: Users },
  ];

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white flex flex-col pt-0">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-[#1a1a1a]/90">
        <div className="max-w-7xl mx-auto bg-[#1a1a1a] px-4 sm:px-6 flex items-center justify-between h-12">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight text-white">
              arm<span className="gradient-text">biz</span> <span className="text-violet-400 font-semibold">Admin</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {loadingData && (
              <RefreshCw className="w-3.5 h-3.5 text-violet-400 animate-spin" />
            )}
            <button
              onClick={load}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/50 hover:text-white shrink-0 cursor-pointer"
              title="Refresh data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation — scrollable on small screens */}
      <nav className="sticky top-12 z-40 bg-[#1a1a1a]/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 flex gap-1 overflow-x-auto scrollbar-none py-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                tab === t.key
                  ? "bg-violet-600/20 text-violet-300"
                  : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              <t.Icon className="w-3.5 h-3.5" /> {t.label}
              {t.key === "businesses" && stats?.pendingBusinesses ? (
                <span className="ml-1 bg-amber-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full">{stats.pendingBusinesses}</span>
              ) : null}
              {t.key === "reviews" && stats?.flaggedReviews ? (
                <span className="ml-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{stats.flaggedReviews}</span>
              ) : null}
              {t.key === "users" && allUsers.length > 0 ? (
                <span className="ml-1 bg-violet-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{allUsers.length}</span>
              ) : null}
            </button>
          ))}
        </div>
      </nav>

      {/* Content wrapper */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-4 pb-12">
        
        {/* ── OVERVIEW TAB ── */}
        {tab === "overview" && stats && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">Platform Overview</h2>
              <p className="text-xs text-white/30">Live statistics across all registered businesses and users.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard label="Total Businesses" value={stats.totalBusinesses} sub={`${stats.verifiedBusinesses} verified`} color="text-violet-300" />
              <StatCard label="Pending Approval" value={stats.pendingBusinesses} sub="Awaiting review" color="text-amber-400" />
              <StatCard label="Total Bookings" value={stats.totalBookings} sub={`${stats.confirmedBookings} confirmed`} color="text-emerald-400" />
              <StatCard label="Active Plans" value={stats.activeSubscriptions} sub="Subscriptions" color="text-sky-400" />
              <StatCard label="Total Users" value={stats.totalUsers} sub="Registered accounts" color="text-pink-400" />
              <StatCard label="Reviews" value={stats.totalReviews} sub={`${stats.flaggedReviews} flagged`} color="text-orange-400" />
              <StatCard label="Revenue (AMD)" value={`֏${stats.totalRevenue.toLocaleString()}`} sub="Active subscriptions" color="text-yellow-400" />
              <StatCard label="Cancelled Bookings" value={stats.cancelledBookings} color="text-red-400" />
            </div>
          </div>
        )}

        {/* ── BUSINESSES TAB ── */}
        {tab === "businesses" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Businesses</h2>
                <p className="text-xs text-white/30">Review, verify, and moderate registered Armenian businesses.</p>
              </div>
              <div className="flex rounded-lg p-0.5 bg-white/5">
                {(["pending", "verified", "all"] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setBizSubTab(mode)}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer capitalize ${
                      bizSubTab === mode 
                        ? "bg-white/10 text-white shadow-sm border-0" 
                        : "text-white/40 hover:text-white"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {filteredBiz.length === 0 ? (
              <div className="text-center py-16 rounded-2xl bg-white/5 border-0">
                <Building2 className="w-10 h-10 mx-auto text-white/20 mb-2" />
                <p className="text-sm font-semibold text-white/50">No businesses found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBiz.map(b => (
                  <div key={b._id} className="bg-white/5 rounded-2xl p-4 flex flex-col md:flex-row justify-between md:items-center gap-4 shadow-sm border-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{b.name}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border-0 ${
                          b.verified ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400"
                        }`}>
                          {b.verified ? "Verified" : "Pending"}
                        </span>
                      </div>
                      <p className="text-xs text-white/40 mt-1">{b.category?.name || "No Category"} • {b.city}</p>
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-white/40">
                        <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-white/40" /> {b.email}</span>
                        {b.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-white/40" /> {b.phone}</span>}
                        <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> {b.rating.toFixed(1)} ({b.reviewCount} reviews)</span>
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      {!b.verified ? (
                        <button
                          onClick={() => approveBiz(b._id)}
                          className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer border-0"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                        </button>
                      ) : (
                        <button
                          onClick={() => rejectBiz(b._id)}
                          className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer border-0"
                        >
                          <Ban className="w-3.5 h-3.5" /> Suspend
                        </button>
                      )}
                      <button
                        onClick={() => deleteBiz(b._id)}
                        className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer border-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── BOOKINGS TAB ── */}
        {tab === "bookings" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white">Bookings</h2>
              <p className="text-xs text-white/30">View and remove registered appointments across the platform.</p>
            </div>

            {bookings.length === 0 ? (
              <div className="text-center py-16 rounded-2xl bg-white/5 border-0">
                <CalendarDays className="w-10 h-10 mx-auto text-white/20 mb-2" />
                <p className="text-sm font-semibold text-white/50">No bookings registered</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map(bk => (
                  <div key={bk._id} className="bg-white/5 rounded-2xl p-4 flex justify-between items-center gap-4 shadow-sm border-0">
                    <div>
                      <span className="font-bold text-sm text-white">{bk.serviceName}</span>
                      <p className="text-xs text-white/40 mt-0.5">at {bk.business?.name || "Business"} • {bk.customerName} ({bk.customerPhone})</p>
                      <p className="text-xs text-white/40 mt-1 font-semibold flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5 text-white/40" /> {bk.date} @ {bk.timeSlot}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border-0 uppercase ${
                        bk.status === "confirmed" ? "bg-green-500/10 text-green-400" :
                        bk.status === "cancelled" ? "bg-red-500/10 text-red-400" :
                        "bg-amber-500/10 text-amber-400"
                      }`}>
                        {bk.status}
                      </span>
                      <button
                        onClick={() => deleteBook(bk._id)}
                        className="bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white p-2 rounded-lg transition-all cursor-pointer border-0"
                        title="Delete booking"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PLANS TAB ── */}
        {tab === "subscriptions" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white">Subscription Plans</h2>
              <p className="text-xs text-white/30">Track active billing details and premium tiers.</p>
            </div>

            {subscriptions.length === 0 ? (
              <div className="text-center py-16 rounded-2xl bg-white/5 border-0">
                <Gem className="w-10 h-10 mx-auto text-white/20 mb-2" />
                <p className="text-sm font-semibold text-white/50">No active subscriptions</p>
              </div>
            ) : (
              <div className="space-y-3">
                {subscriptions.map(s => (
                  <div key={s._id} className="bg-white/5 rounded-2xl p-4 flex justify-between items-center gap-4 shadow-sm border-0">
                    <div>
                      <span className="font-bold text-sm capitalize text-white">{s.plan} Plan</span>
                      <p className="text-xs text-white/40 mt-0.5">Business: {s.business?.name || "Business"} ({s.business?.email})</p>
                      <p className="text-xs text-white/40 mt-1 font-semibold flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5 text-white/40" /> Cycle: {new Date(s.startDate).toLocaleDateString()} to {new Date(s.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border-0 uppercase ${
                        s.status === "active" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                      }`}>
                        {s.status}
                      </span>
                      <button
                        onClick={() => deleteSub(s._id)}
                        className="bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white p-2 rounded-lg transition-all cursor-pointer border-0"
                        title="Cancel Subscription"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── REPORTS TAB ── */}
        {tab === "reviews" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white">Review Moderation</h2>
              <p className="text-xs text-white/30">Inspect flagged reviews and respond to business owner report appeals.</p>
            </div>

            {reviews.length === 0 ? (
              <div className="text-center py-16 rounded-2xl bg-white/5 border-0">
                <CheckCircle className="w-10 h-10 mx-auto text-green-500 mb-2" />
                <p className="text-sm font-semibold text-white/50">Queue is clear!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map(r => (
                  <div key={r._id} className="bg-white/5 rounded-2xl p-5 hover:bg-white/8 transition-all shadow-sm border-0">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-white/40">Flagged on:</span>
                          <span className="text-sm font-bold text-white">{r.business?.name}</span>
                          <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">Reported</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-white/40">
                          <span>By: <strong>{r.author?.name || "Anonymous"}</strong></span>
                          <span>•</span>
                          <span className="flex items-center text-amber-400">
                            Rating: {r.rating} <Star className="w-3 h-3 fill-amber-400 text-amber-400 ml-0.5" />
                          </span>
                          {r.reportedAt && (
                            <>
                              <span>•</span>
                              <span>Date: {new Date(r.reportedAt).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {resolvingId !== r._id && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setResolvingId(r._id); setResolveAction("keep"); }}
                            className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg cursor-pointer border-0"
                          >
                            Keep Review
                          </button>
                          <button
                            onClick={() => { setResolvingId(r._id); setResolveAction("delete"); }}
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg cursor-pointer border-0"
                          >
                            Delete Review
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white/5 p-3.5 rounded-xl border-0">
                        <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider block mb-1">Review Content</span>
                        <p className="text-xs italic text-white/90">&ldquo;{r.comment}&rdquo;</p>
                      </div>
                      <div className="bg-red-500/5 p-3.5 rounded-xl border-0">
                        <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wider block mb-1">Report Reason</span>
                        <p className="text-xs text-white/90">{r.reportedReason || "Inappropriate content"}</p>
                      </div>
                    </div>

                    {resolvingId === r._id && (
                      <form onSubmit={submitResolve} className="mt-5 border-t border-white/5 pt-4 space-y-3">
                        <div className="bg-white/5 p-4 rounded-xl border-0">
                          <h4 className="text-xs font-bold text-white mb-1 flex items-center gap-1">
                            {resolveAction === "delete" ? "Delete Review & Reply" : "Keep Review & Reply"}
                          </h4>
                          <p className="text-[11px] text-white/40 mb-3">
                            Provide a message explaining why this review was {resolveAction === "delete" ? "deleted" : "kept"}. An official notification will be sent to the business owner.
                          </p>
                          <textarea
                            value={adminReply}
                            onChange={e => setAdminReply(e.target.value)}
                            placeholder="Explain your decision (e.g. This review conforms to community guidelines / This review constitutes spam.)"
                            rows={3}
                            className="w-full text-xs rounded-lg bg-[#1a1a1a] p-3 outline-none focus:border-violet-500/70 text-white placeholder-white/20 border-0"
                            required
                          />
                          <div className="flex justify-end gap-2 mt-3">
                            <button
                              type="button"
                              onClick={() => { setResolvingId(null); setResolveAction(null); }}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-white/5 cursor-pointer text-white/60 hover:text-white border-0"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className={`px-3 py-1.5 text-xs font-medium text-white rounded-lg cursor-pointer border-0 ${
                                resolveAction === "delete" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                              }`}
                            >
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

        {/* ── USERS TAB ── */}
        {tab === "users" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white">All Users</h2>
              <p className="text-xs text-white/30">View and moderate all registered users.</p>
            </div>

            {allUsers.length === 0 ? (
              <div className="text-center py-16 rounded-2xl bg-white/5 border-0">
                <Users className="w-10 h-10 mx-auto text-white/20 mb-2" />
                <p className="text-sm font-semibold text-white/50">No registered users found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allUsers.map(u => {
                  const isCurAdmin = u.role === "admin";
                  const RoleIcon = isCurAdmin ? Crown : u.role === "business_owner" ? Briefcase : UserCircle2;
                  const badgeColor = isCurAdmin ? "bg-violet-500/10 text-violet-400" :
                    u.role === "business_owner" ? "bg-sky-500/10 text-sky-400" :
                    "bg-white/5 text-white/40";
                  
                  return (
                    <div key={u._id} className="bg-white/5 rounded-2xl p-4 flex justify-between items-center gap-4 shadow-sm border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center shrink-0 border-0">
                          <RoleIcon className="w-4 h-4 text-white/40" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">{u.name}</span>
                            {u.username && <span className="text-xs text-white/40">@{u.username}</span>}
                          </div>
                          <p className="text-xs text-white/40 mt-0.5">Email: {u.email} • Joined: {new Date(u.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border-0 uppercase ${badgeColor}`}>
                          {u.role.replace("_", " ")}
                        </span>
                        {!isCurAdmin && (
                          <button
                            onClick={() => deleteUserById(u._id)}
                            className="bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white p-2 rounded-lg transition-all cursor-pointer border-0"
                            title="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

// ─── ROOT PAGE ───────────────────────────────────────────────────────────────
export default function AdminSecurePage() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Restore admin session from dedicated key (separate from regular user session)
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    const savedUser = localStorage.getItem(ADMIN_USER_KEY);
    if (token && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        if (user?.role === "admin") {
          setAuthed(true);
        }
      } catch {
        // ignore
      }
    }
    setChecking(false);
  }, []);

  const handleLogin = (token: string) => {
    setAuthed(true);
  };

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
    setAuthed(false);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <svg className="w-8 h-8 text-violet-500 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    );
  }

  if (!authed) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return <AdminDashboard onLogout={handleLogout} />;
}