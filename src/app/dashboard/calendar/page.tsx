"use client";
import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Plus, Loader2, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getApiUrl } from "@/lib/utils";
import axios from "axios";

interface DailySummary {
  _id: string;
  date: string;
  summary: string;
  stats?: any;
}

const STAT_LABELS: Record<string, string> = {
  totalBookings: "Total Bookings",
  reviewsCount: "Reviews",
  approvedBookings: "Approved",
  rejectedBookings: "Rejected",
  avgRating: "Avg. Rating"
};

export default function CalendarPage() {
  const { currentUser } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());

  const [businessCreatedAt, setBusinessCreatedAt] = useState<Date | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalSummary, setModalSummary] = useState("");
  const [fixedStats, setFixedStats] = useState({
    totalBookings: "",
    reviewsCount: "",
    approvedBookings: "",
    rejectedBookings: "",
    avgRating: ""
  });
  const [saving, setSaving] = useState(false);

  // Load business & summaries
  useEffect(() => {
    async function loadData() {
      const bId = (currentUser as any)?.businessId || (currentUser as any)?.business?._id;
      const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
      if (!bId || !token) {
        setLoading(false);
        return;
      }
      setBusinessId(bId);

      try {
        setLoading(true);
        // 1. Fetch business to get createdAt
        const bizRes = await axios.get(`${getApiUrl()}/businesses/${bId}`);
        if (bizRes.data?.success) {
          setBusinessCreatedAt(new Date(bizRes.data.data.createdAt));
        }

        // 2. Fetch summaries for current month
        const monthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        const sumRes = await axios.get(`${getApiUrl()}/businesses/${bId}/calendar?month=${monthStr}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (sumRes.data?.success) {
          setSummaries(sumRes.data.data || []);
        }
      } catch (err) {
        console.error("Error loading calendar data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentUser, currentDate.getMonth(), currentDate.getFullYear()]);

  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Mon -> Sun

  const getDaySummary = (day: number) => {
    const dStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return summaries.find(s => s.date === dStr);
  };

  const isBeforeRegistration = (date: Date) => {
    if (!businessCreatedAt) return false;
    // reset times to midnight for comparison
    const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const regDate = new Date(businessCreatedAt.getFullYear(), businessCreatedAt.getMonth(), businessCreatedAt.getDate());
    return compareDate < regDate;
  };

  const canGoPrevMonth = useMemo(() => {
    if (!businessCreatedAt) return true;
    const prevMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const regMonthDate = new Date(businessCreatedAt.getFullYear(), businessCreatedAt.getMonth(), 1);
    return prevMonthDate >= regMonthDate;
  }, [currentDate, businessCreatedAt]);

  const prevMonth = () => {
    if (canGoPrevMonth) {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    }
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const setToday = () => {
    setCurrentDate(new Date());
  };

  const openDayModal = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    if (isBeforeRegistration(date)) return;

    setSelectedDate(date);
    const sum = getDaySummary(day);
    setModalSummary(sum?.summary || "");

    const initialStatsObj = sum?.stats || {};
    setFixedStats({
      totalBookings: initialStatsObj.totalBookings !== undefined ? String(initialStatsObj.totalBookings) : "",
      reviewsCount: initialStatsObj.reviewsCount !== undefined ? String(initialStatsObj.reviewsCount) : "",
      approvedBookings: initialStatsObj.approvedBookings !== undefined ? String(initialStatsObj.approvedBookings) : "",
      rejectedBookings: initialStatsObj.rejectedBookings !== undefined ? String(initialStatsObj.rejectedBookings) : "",
      avgRating: initialStatsObj.avgRating !== undefined ? String(initialStatsObj.avgRating) : ""
    });

    setIsModalOpen(true);
  };

  const saveDailySummary = async () => {
    if (!selectedDate || !businessId) return;

    const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
    const dStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

    let parsedStats: Record<string, any> = {};
    Object.entries(fixedStats).forEach(([k, v]) => {
      if (v.trim() !== "") {
        parsedStats[k] = isNaN(Number(v)) ? v : Number(v);
      }
    });

    try {
      setSaving(true);
      const res = await axios.post(`${getApiUrl()}/businesses/${businessId}/calendar/${dStr}`, {
        summary: modalSummary,
        stats: parsedStats
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success) {
        // Update local state
        setSummaries(prev => {
          const idx = prev.findIndex(s => s.date === dStr);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = res.data.data;
            return copy;
          }
          return [...prev, res.data.data];
        });
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error("Failed to save summary", err);
      alert("Error saving summary");
    } finally {
      setSaving(false);
    }
  };

  if (loading && summaries.length === 0) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-[hsl(var(--muted-foreground))]">Manage your schedule and view daily summaries.</p>
        </div>
      </div>

      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl shadow-sm overflow-hidden">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-5 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/20">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-emerald-500" />
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex items-center gap-2 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg p-1 shadow-sm">
            <button
              onClick={prevMonth}
              disabled={!canGoPrevMonth}
              className={`p-1.5 rounded-md transition-colors ${canGoPrevMonth ? 'hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]' : 'opacity-30 cursor-not-allowed text-[hsl(var(--muted-foreground))]'}`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={setToday} className="px-3 py-1.5 text-sm font-semibold hover:bg-[hsl(var(--muted))] rounded-md transition-colors">
              Today
            </button>
            <button onClick={nextMonth} className="p-1.5 hover:bg-[hsl(var(--muted))] rounded-md transition-colors text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/10">
          {daysOfWeek.map(day => (
            <div key={day} className="py-3 text-center text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 auto-rows-[minmax(120px,auto)]">
          {Array.from({ length: startDay }).map((_, i) => (
            <div key={`empty-${i}`} className="border-r border-b border-[hsl(var(--border))]/50 bg-[hsl(var(--muted))]/5 p-2"></div>
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const iterDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
            const summaryData = getDaySummary(day);
            const disabled = isBeforeRegistration(iterDate);

            return (
              <div
                key={day}
                onClick={() => openDayModal(day)}
                className={`group border-r border-b border-[hsl(var(--border))]/50 p-2 sm:p-3 transition-colors ${disabled
                  ? 'bg-[hsl(var(--muted))]/30 opacity-50 cursor-not-allowed'
                  : isToday
                    ? 'bg-emerald-500/10 hover:bg-emerald-500/20 cursor-pointer'
                    : 'bg-[hsl(var(--background))] hover:bg-[hsl(var(--muted))]/20 cursor-pointer'
                  }`}
              >
                <div className="flex justify-between items-start">
                  <span className={`text-sm font-medium w-8 h-8 flex items-center justify-center rounded-full transition-colors ${isToday
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'text-[hsl(var(--foreground))] group-hover:bg-[hsl(var(--muted))]'
                    }`}>
                    {day}
                  </span>
                </div>
                {summaryData && (
                  <div className="mt-2 space-y-1.5 overflow-y-auto max-h-[100px] pr-1 custom-scrollbar">
                    {summaryData.summary && (
                      <div className="text-xs p-2 rounded-lg transition-all shadow-sm bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20">
                        <div className="font-semibold flex items-center gap-1 mb-0.5 opacity-80">
                          <Clock className="w-3 h-3" /> Summary
                        </div>
                        <div className="font-medium text-[11px] leading-tight break-words line-clamp-2">{summaryData.summary}</div>
                      </div>
                    )}
                    {summaryData.stats && Object.keys(summaryData.stats).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {Object.entries(summaryData.stats).map(([k, v]) => (
                          <div key={k} className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-md font-semibold border border-emerald-500/20 shadow-sm flex items-center gap-1">
                            <span className="opacity-70">{STAT_LABELS[k] || k}:</span> <span>{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Fill remaining cells */}
          {Array.from({ length: (7 - ((startDay + daysInMonth) % 7)) % 7 }).map((_, i) => (
            <div key={`empty-end-${i}`} className="border-r border-b border-[hsl(var(--border))]/50 bg-[hsl(var(--muted))]/5 p-2"></div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))]/50 w-full max-w-lg rounded-2xl p-6 relative shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600"></div>

            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[hsl(var(--border))]/50 pt-2">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                Daily Summary
              </h2>
              <div className="px-3 py-1 bg-[hsl(var(--muted))]/50 rounded-full border border-[hsl(var(--border))] text-sm font-semibold text-[hsl(var(--foreground))]">
                {selectedDate.toLocaleDateString()}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-5">
              <div className="group">
                <label className="block text-sm font-semibold mb-2 text-[hsl(var(--foreground))] transition-colors">
                  Notes / Summary
                </label>
                <textarea
                  className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors min-h-[110px] resize-y custom-scrollbar"
                  placeholder="Enter day's summary, meetings, insights..."
                  value={modalSummary}
                  onChange={e => setModalSummary(e.target.value)}
                />
              </div>

              <div className="group">
                <label className="block text-sm font-semibold mb-3 text-[hsl(var(--foreground))] transition-colors">
                  Daily Statistics (Auto-generated)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[hsl(var(--muted))]/20 border border-[hsl(var(--border))] rounded-xl p-3 flex flex-col items-center justify-center text-center">
                    <span className="block text-[11px] uppercase tracking-wider font-semibold text-[hsl(var(--muted-foreground))] mb-1">Total Bookings</span>
                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{fixedStats.totalBookings || "0"}</span>
                  </div>
                  <div className="bg-[hsl(var(--muted))]/20 border border-[hsl(var(--border))] rounded-xl p-3 flex flex-col items-center justify-center text-center">
                    <span className="block text-[11px] uppercase tracking-wider font-semibold text-[hsl(var(--muted-foreground))] mb-1">Reviews</span>
                    <span className="text-xl font-bold text-[hsl(var(--foreground))]">{fixedStats.reviewsCount || "0"}</span>
                  </div>
                  <div className="bg-[hsl(var(--muted))]/20 border border-[hsl(var(--border))] rounded-xl p-3 flex flex-col items-center justify-center text-center">
                    <span className="block text-[11px] uppercase tracking-wider font-semibold text-[hsl(var(--muted-foreground))] mb-1">Approved</span>
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{fixedStats.approvedBookings || "0"}</span>
                  </div>
                  <div className="bg-[hsl(var(--muted))]/20 border border-[hsl(var(--border))] rounded-xl p-3 flex flex-col items-center justify-center text-center">
                    <span className="block text-[11px] uppercase tracking-wider font-semibold text-[hsl(var(--muted-foreground))] mb-1">Rejected</span>
                    <span className="text-xl font-bold text-red-600 dark:text-red-400">{fixedStats.rejectedBookings || "0"}</span>
                  </div>
                  <div className="col-span-2 bg-[hsl(var(--muted))]/20 border border-[hsl(var(--border))] rounded-xl p-3 flex flex-col items-center justify-center text-center">
                    <span className="block text-[11px] uppercase tracking-wider font-semibold text-[hsl(var(--muted-foreground))] mb-1">Avg. Rating</span>
                    <span className="text-xl font-bold text-amber-500">{fixedStats.avgRating || "0.0"}</span>
                  </div>
                </div>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-3 flex items-center gap-1.5 bg-[hsl(var(--muted))]/30 p-2 rounded-lg border border-[hsl(var(--border))]/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  These statistics are compiled automatically at the end of the day.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-[hsl(var(--border))]/50">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-sm font-semibold rounded-xl border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={saveDailySummary}
                className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all"
                disabled={saving}
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
