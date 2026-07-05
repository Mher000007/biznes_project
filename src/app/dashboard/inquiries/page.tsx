"use client";
import { useState, useEffect } from "react";
import { MessageSquare, Star } from "lucide-react";
import axios from "axios";
import { getApiUrl } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const API = getApiUrl();

interface DashboardInquiry {
  id: string | number;
  name: string;
  subject: string;
  time: string;
  status: string;
  phone?: string;
  timeSlot?: string;
  price?: number;
  notes?: string;
  rating?: number;
  type?: "booking" | "review" | "notification";
  createdAt?: string;
  reportedReason?: string;
  adminReply?: string;
}

function authHeader() {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function InquiriesPage() {
  const { currentUser } = useAuth();
  const [inquiries, setInquiries] = useState<DashboardInquiry[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "bookings" | "reviews" | "notifications">("all");
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);

  // Report modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [activeReportReviewId, setActiveReportReviewId] = useState<string | number | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportError, setReportError] = useState("");

  const handleOpenReportModal = (reviewId: string | number) => {
    setActiveReportReviewId(reviewId);
    setReportReason("");
    setReportError("");
    setReportModalOpen(true);
  };

  const handleCloseReportModal = () => {
    setReportModalOpen(false);
    setActiveReportReviewId(null);
    setReportReason("");
    setReportError("");
  };

  const handleSubmitReport = async () => {
    if (!activeReportReviewId || reportReason.trim().length < 5) return;
    setIsSubmittingReport(true);
    setReportError("");
    try {
      const res = await axios.post(
        `${API}/businesses/${businessId}/reviews/${activeReportReviewId}/report`,
        { reportedReason: reportReason.trim() },
        { headers: authHeader() }
      );
      if (res.data?.success) {
        setInquiries((prev) =>
          prev.map((inq) =>
            inq.id === activeReportReviewId
              ? { ...inq, status: "reported", reportedReason: reportReason.trim() }
              : inq
          )
        );
        handleCloseReportModal();
      }
    } catch (err: any) {
      setReportError(err.response?.data?.message || "Could not submit report. Please try again.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleUpdateStatus = async (bookingId: string | number, newStatus: "confirmed" | "cancelled") => {
    try {
      await axios.put(`${API}/bookings/${bookingId}/status`, { status: newStatus }, { headers: authHeader() });
    } catch (e) {
      console.error("Error updating booking status", e);
    }
    setInquiries((prev) => prev.map((inq) => (inq.id === bookingId ? { ...inq, status: newStatus } : inq)));
  };

  const handleDeleteBooking = async (bookingId: string | number) => {
    if (!confirm("Are you sure you want to delete this booking request?")) return;
    try {
      await axios.delete(`${API}/bookings/${bookingId}`, { headers: authHeader() });
    } catch (e) {
      console.error("Error deleting booking", e);
    }
    setInquiries((prev) => prev.filter((inq) => inq.id !== bookingId));
  };

  const handleMarkAsRead = async (notifId: string) => {
    try {
      await axios.put(`${API}/notifications/${notifId}/read`, {}, { headers: authHeader() });
      setInquiries(prev => prev.map(inq => 
        inq.id === notifId && inq.type === "notification"
          ? { ...inq, status: "read" }
          : inq
      ));
    } catch (e) {
      console.error("Failed to mark as read", e);
    }
  };

  useEffect(() => {
    async function loadData() {
      if (!currentUser) return;
      try {
        const bizRes = await axios.get(`${API}/businesses/me/all`, { headers: authHeader() });
        const businesses = bizRes.data?.data || [];

        if (businesses.length === 0) {
          setLoading(false);
          return;
        }

        const biz = businesses[0];
        setBusinessId(biz._id);

        const allItems: DashboardInquiry[] = [];

        // Load bookings
        try {
          const bookingsRes = await axios.get(`${API}/bookings/business/${biz._id}`, { headers: authHeader() });
          if (bookingsRes.data?.success) {
            allItems.push(
              ...(bookingsRes.data.data || []).map((b: any) => ({
                id: b._id,
                name: b.customerName,
                subject: `Appointment — ${b.serviceName}`,
                time: new Date(b.date || b.createdAt).toLocaleDateString(),
                status: b.status || "pending",
                phone: b.customerPhone,
                timeSlot: b.timeSlot,
                price: b.totalPrice,
                notes: b.notes,
                type: "booking" as const,
                createdAt: b.createdAt || b.date,
              }))
            );
          }
        } catch { /* bookings endpoint may not exist yet */ }

        // Load reviews
        try {
          const reviewsRes = await axios.get(`${API}/businesses/${biz._id}/reviews`, { headers: authHeader() });
          if (reviewsRes.data?.success) {
            const revs = reviewsRes.data.data || [];
            allItems.push(
              ...revs.map((r: any) => ({
                id: r._id,
                name: r.authorName || r.author?.name || "Anonymous",
                subject: `Review — "${(r.comment || "").substring(0, 60)}"`,
                time: new Date(r.createdAt).toLocaleDateString(),
                status: r.status || "approved",
                notes: r.comment,
                rating: r.rating,
                type: "review" as const,
                createdAt: r.createdAt,
                reportedReason: r.reportedReason,
                adminReply: r.adminReply,
              }))
            );
          }
        } catch { /* reviews endpoint may not be mounted yet */ }

        // Load notifications
        try {
          const notifRes = await axios.get(`${API}/notifications`, { headers: authHeader() });
          if (notifRes.data?.success) {
            const notifs = notifRes.data.data || [];
            allItems.push(...notifs.map((n: any) => ({
              id: n._id,
              name: "System Notification",
              subject: n.title,
              time: new Date(n.createdAt).toLocaleDateString(),
              status: n.readBy?.includes(currentUser?.id) ? "read" : "unread",
              notes: n.message,
              type: "notification" as const,
              createdAt: n.createdAt,
            })));
          }
        } catch { /* notifications endpoint might fail */ }

        allItems.sort((a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime());
        setInquiries(allItems);
      } catch (err) {
        console.warn("Inquiries load failed", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [currentUser]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Inquiries</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Manage messages, bookings, reviews, and notifications all in one place.</p>
      </div>

      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-5 border-b border-[hsl(var(--border))] gap-3">
          <h2 className="text-sm font-semibold">All Activity</h2>
          <div className="flex gap-1.5 text-xs bg-[hsl(var(--muted))]/50 p-1 rounded-xl self-start sm:self-center">
            {(() => {
              const unreadNotifsCount = inquiries.filter(inq => inq.type === "notification" && inq.status === "unread").length;
              return (["all", "bookings", "reviews", "notifications"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all capitalize ${
                    activeTab === tab
                      ? "bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm"
                      : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] bg-transparent"
                  }`}
                >
                  {tab}
                  {tab === "notifications" && unreadNotifsCount > 0 && (
                    <span className="flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full bg-emerald-500 text-white text-[9px] font-bold">
                      {unreadNotifsCount}
                    </span>
                  )}
                </button>
              ));
            })()}
          </div>
        </div>

        <div className="divide-y divide-[hsl(var(--border))]">
          {inquiries
            .filter((inq) => {
              if (activeTab === "bookings") return inq.type === "booking";
              if (activeTab === "reviews") return inq.type === "review";
              if (activeTab === "notifications") return inq.type === "notification";
              return true;
            })
            .map((inq) => (
              <div key={inq.id} className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 hover:bg-[hsl(var(--muted))]/50 transition-colors gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {inq.type === "notification" && inq.status === "unread" && (
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                    <span className="text-sm font-semibold">{inq.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      inq.type === "review"
                        ? inq.status === "reported" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse"
                          : inq.status === "resolved_kept" ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                          : inq.status === "resolved_deleted" ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        : inq.type === "notification"
                          ? inq.status === "unread" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
                        : inq.status === "pending" || inq.status === "new" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                        : inq.status === "confirmed" || inq.status === "replied" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : inq.status === "cancelled" ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    }`}>
                      {inq.type === "review" ? `Review${inq.status && inq.status !== "approved" && inq.status !== "read" ? ` (${inq.status})` : ""}` : inq.type === "notification" ? "Notification" : inq.status}
                    </span>
                    {inq.type === "review" && inq.rating && (
                      <span className="flex gap-0.5 ml-1 text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(inq.rating || 0) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                        ))}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-[hsl(var(--foreground))] mb-2">{inq.subject}</p>

                  {inq.type === "booking" && (inq.phone || inq.timeSlot || inq.price || inq.notes) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))]/30 p-2.5 rounded-xl border border-[hsl(var(--border))]/40 max-w-xl">
                      {inq.phone && <div className="flex items-center gap-1"><span className="font-semibold text-[hsl(var(--foreground))]">Phone:</span><span>{inq.phone}</span></div>}
                      {inq.timeSlot && <div className="flex items-center gap-1"><span className="font-semibold text-[hsl(var(--foreground))]">Time Slot:</span><span>{inq.timeSlot}</span></div>}
                      {inq.price !== undefined && inq.price > 0 && <div className="flex items-center gap-1"><span className="font-semibold text-[hsl(var(--foreground))]">Price:</span><span className="text-emerald-600 font-medium">{inq.price.toLocaleString()} AMD</span></div>}
                      {inq.notes && (
                        <div className="sm:col-span-2 border-t border-[hsl(var(--border))]/20 pt-1.5 mt-0.5">
                          <span className="font-semibold text-[hsl(var(--foreground))]">Notes:</span>
                          <p className="mt-0.5 text-xs italic bg-[hsl(var(--card))]/50 p-1.5 rounded border border-[hsl(var(--border))]/20">&ldquo;{inq.notes}&rdquo;</p>
                        </div>
                      )}
                    </div>
                  )}

                  {inq.type === "review" && inq.notes && (
                    <div className="text-[11px] text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))]/30 p-2.5 rounded-xl border border-[hsl(var(--border))]/40 max-w-xl">
                      <span className="font-semibold text-[hsl(var(--foreground))]">Comment:</span>
                      <p className="mt-0.5 text-xs italic bg-[hsl(var(--card))]/50 p-1.5 rounded border border-[hsl(var(--border))]/20">&ldquo;{inq.notes}&rdquo;</p>
                      {inq.status === "reported" && (
                        <div className="mt-2 text-[10px] text-amber-600 bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-200/30 flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                          <span>Reported: &ldquo;{inq.reportedReason}&rdquo; (Under Review)</span>
                        </div>
                      )}
                      {inq.status === "resolved_kept" && (
                        <div className="mt-2 text-[10px] text-green-600 bg-green-500/10 px-2.5 py-1.5 rounded-lg border border-green-200/30">
                          <div className="font-semibold mb-0.5">Moderator Decision: Kept</div>
                          <p className="italic">&ldquo;{inq.adminReply || "No message provided."}&rdquo;</p>
                        </div>
                      )}
                      {inq.status === "resolved_deleted" && (
                        <div className="mt-2 text-[10px] text-red-600 bg-red-500/10 px-2.5 py-1.5 rounded-lg border border-red-200/30">
                          <div className="font-semibold mb-0.5">Moderator Decision: Deleted</div>
                          <p className="italic">&ldquo;{inq.adminReply || "No message provided."}&rdquo;</p>
                        </div>
                      )}
                    </div>
                  )}

                  {inq.type === "notification" && inq.notes && (
                    <div className="text-[11px] text-[hsl(var(--foreground))] bg-[hsl(var(--primary))]/5 p-3 rounded-xl border border-[hsl(var(--primary))]/10 max-w-xl shadow-sm">
                      <p className="text-sm leading-relaxed">{inq.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0 self-start sm:self-center">
                  <span className="text-xs text-[hsl(var(--muted-foreground))] font-medium">{inq.time}</span>
                  {inq.type === "booking" && (
                    <div className="flex gap-1.5 mt-1">
                      {inq.status !== "confirmed" && inq.status !== "replied" && (
                        <button onClick={() => handleUpdateStatus(inq.id, "confirmed")} className="px-2.5 py-1 text-[10px] font-semibold bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all shadow-sm cursor-pointer">Confirm</button>
                      )}
                      {inq.status !== "cancelled" && (
                        <button onClick={() => handleUpdateStatus(inq.id, "cancelled")} className="px-2.5 py-1 text-[10px] font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all shadow-sm cursor-pointer">Cancel</button>
                      )}
                      <button onClick={() => handleDeleteBooking(inq.id)} className="px-2.5 py-1 text-[10px] font-semibold bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all shadow-sm cursor-pointer">Delete</button>
                    </div>
                  )}
                  {inq.type === "review" && (
                    <div className="flex gap-1.5 mt-1">
                      {(!inq.status || inq.status === "approved" || inq.status === "read") && (
                        <button onClick={() => handleOpenReportModal(inq.id)} className="px-2.5 py-1 text-[10px] font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all shadow-sm cursor-pointer">Report</button>
                      )}
                    </div>
                  )}
                  {inq.type === "notification" && inq.status === "unread" && (
                    <div className="flex gap-1.5 mt-1">
                      <button onClick={() => handleMarkAsRead(inq.id as string)} className="px-2.5 py-1 text-[10px] font-semibold bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))] rounded-lg transition-all shadow-sm cursor-pointer">Mark as Read</button>
                    </div>
                  )}
                </div>
              </div>
            ))}

          {inquiries.filter((inq) => {
            if (activeTab === "bookings") return inq.type === "booking";
            if (activeTab === "reviews") return inq.type === "review";
            if (activeTab === "notifications") return inq.type === "notification";
            return true;
          }).length === 0 && (
            <div className="p-8 text-center text-xs text-[hsl(var(--muted-foreground))]">
              {loading ? "Loading activity…" : activeTab === "bookings" ? "No recent bookings." : activeTab === "reviews" ? "No recent reviews." : activeTab === "notifications" ? "No notifications." : "No recent activity yet."}
            </div>
          )}
        </div>
      </div>
      
      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[hsl(var(--background))] rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold mb-2 text-[hsl(var(--foreground))]">Report Review</h3>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-4">Please provide a reason for reporting this review to our moderation team.</p>
            <textarea
              className="w-full h-24 p-3 text-sm rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/50 mb-4 resize-none"
              placeholder="Reason for report..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            />
            {reportError && <div className="text-xs text-red-500 mb-4">{reportError}</div>}
            <div className="flex gap-2 justify-end">
              <button 
                onClick={handleCloseReportModal}
                className="px-4 py-2 text-sm font-semibold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors cursor-pointer"
                disabled={isSubmittingReport}
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmitReport}
                className="px-4 py-2 text-sm font-semibold bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-lg hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-2"
                disabled={isSubmittingReport || reportReason.trim().length < 5}
              >
                {isSubmittingReport ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
