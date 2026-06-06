"use client";
import { useState, useEffect } from "react";
import { Eye, MessageSquare, Star, TrendingUp, ArrowUpRight } from "lucide-react";
import DashboardPublish from "./DashboardPublish";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { getBusinessProfile } from "@/lib/auth";
import axios from "axios";

const DEFAULT_STATS = [
  { label: "Total Views", value: "0", change: "+0%", icon: Eye },
  { label: "Inquiries", value: "0", change: "+0%", icon: MessageSquare },
  { label: "Avg. Rating", value: "0.0", change: "+0.0", icon: Star },
  { label: "Profile Rank", value: "#0", change: "+0", icon: TrendingUp },
];

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
  type?: 'booking' | 'review';
  createdAt?: string;
  reportedReason?: string;
  adminReply?: string;
}

const DEFAULT_INQUIRIES: DashboardInquiry[] = [
  { id: 1, name: "Armen Grigoryan", subject: "Partnership inquiry", time: "2 hours ago", status: "new", type: "booking" },
  { id: 2, name: "Seda Hovhannisyan", subject: "Service pricing", time: "5 hours ago", status: "read", type: "booking" },
  { id: 3, name: "David Mkrtchyan", subject: "Collaboration proposal", time: "1 day ago", status: "replied", type: "booking" },
  { id: 4, name: "Anna Petrosyan", subject: "Custom solution request", time: "2 days ago", status: "new", type: "booking" },
];

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const displayName = currentUser?.displayName || currentUser?.username || "User";
  
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [recentInquiries, setRecentInquiries] = useState<DashboardInquiry[]>(DEFAULT_INQUIRIES);
  const [activeTab, setActiveTab] = useState<'all' | 'bookings' | 'reviews'>('all');
  const [loading, setLoading] = useState(true);

  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessSlug, setBusinessSlug] = useState<string | null>(null);

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

    // 1. Try local storage first
    try {
      const isLocal = typeof activeReportReviewId === 'number' || activeReportReviewId.toString().startsWith('local-');
      if (isLocal) {
        const targetSlug = businessSlug || (getBusinessProfile(currentUser.username) as any)?.businessName?.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]/g, "") || "armtech-solutions";
        const raw = window.localStorage.getItem(`armbiz-reviews-${targetSlug}`);
        if (raw) {
          const reviewsList = JSON.parse(raw);
          const index = reviewsList.findIndex((r: any) => r._id === activeReportReviewId || r._id === String(activeReportReviewId));
          if (index !== -1) {
            reviewsList[index].status = 'reported';
            reviewsList[index].reportedReason = reportReason.trim();
            reviewsList[index].reportedAt = new Date().toISOString();
            window.localStorage.setItem(`armbiz-reviews-${targetSlug}`, JSON.stringify(reviewsList));

            setRecentInquiries(prev => prev.map(inq => 
              inq.id === activeReportReviewId 
                ? { ...inq, status: 'reported', reportedReason: reportReason.trim() } 
                : inq
            ));
            handleCloseReportModal();
            setIsSubmittingReport(false);
            return;
          }
        }
      }
    } catch (e) {
      console.error("Error updating local review report", e);
    }

    // 2. Try Backend API
    try {
      const apiURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
      
      const res = await axios.post(
        `${apiURL}/businesses/${businessId}/reviews/${activeReportReviewId}/report`,
        { reportedReason: reportReason.trim() },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      if (res.data?.success) {
        setRecentInquiries(prev => prev.map(inq => 
          inq.id === activeReportReviewId 
            ? { ...inq, status: 'reported', reportedReason: reportReason.trim() } 
            : inq
        ));
        handleCloseReportModal();
      }
    } catch (err: any) {
      console.error("Error submitting report to backend", err);
      const msg = err.response?.data?.message || "Could not report review on backend, falling back to offline mode.";
      setReportError(msg);
      
      // Fallback update since backend failed or is offline
      try {
        const targetSlug = businessSlug || (getBusinessProfile(currentUser.username) as any)?.businessName?.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]/g, "") || "armtech-solutions";
        const raw = window.localStorage.getItem(`armbiz-reviews-${targetSlug}`);
        if (raw) {
          const reviewsList = JSON.parse(raw);
          const index = reviewsList.findIndex((r: any) => r._id === activeReportReviewId || r._id === String(activeReportReviewId));
          if (index !== -1) {
            reviewsList[index].status = 'reported';
            reviewsList[index].reportedReason = reportReason.trim();
            reviewsList[index].reportedAt = new Date().toISOString();
            window.localStorage.setItem(`armbiz-reviews-${targetSlug}`, JSON.stringify(reviewsList));
            setRecentInquiries(prev => prev.map(inq => 
              inq.id === activeReportReviewId 
                ? { ...inq, status: 'reported', reportedReason: reportReason.trim() } 
                : inq
            ));
            handleCloseReportModal();
          }
        }
      } catch (innerErr) {
        setReportError("Error writing report locally.");
      }
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleUpdateStatus = async (bookingId: string | number, newStatus: 'confirmed' | 'cancelled') => {
    // 1. Try local storage first
    try {
      const localBookings = JSON.parse(window.localStorage.getItem("armbiz-local-bookings") || "[]");
      const index = localBookings.findIndex((b: any) => b.id === bookingId);
      if (index !== -1) {
        localBookings[index].status = newStatus;
        window.localStorage.setItem("armbiz-local-bookings", JSON.stringify(localBookings));
        
        // Update state locally
        setRecentInquiries(prev => prev.map(inq => inq.id === bookingId ? { ...inq, status: newStatus } : inq));
        return;
      }
    } catch (e) {
      console.error("Error updating local booking status", e);
    }

    // 2. Try backend API
    try {
      const apiURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
      const res = await axios.put(`${apiURL}/bookings/${bookingId}/status`, { status: newStatus }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data?.success) {
        setRecentInquiries(prev => prev.map(inq => inq.id === bookingId ? { ...inq, status: newStatus } : inq));
      }
    } catch (e) {
      console.error("Error updating backend booking status", e);
    }
  };

  const handleDeleteBooking = async (bookingId: string | number) => {
    if (!confirm("Are you sure you want to delete this booking request?")) return;
    
    // 1. Try local storage first
    try {
      const localBookings = JSON.parse(window.localStorage.getItem("armbiz-local-bookings") || "[]");
      const filtered = localBookings.filter((b: any) => b.id !== bookingId);
      if (filtered.length !== localBookings.length) {
        window.localStorage.setItem("armbiz-local-bookings", JSON.stringify(filtered));
        
        // Update state locally
        setRecentInquiries(prev => prev.filter(inq => inq.id !== bookingId));
        // Recalculate inquiries count stat card
        setStats(prev => prev.map(stat => {
          if (stat.label === "Inquiries") {
            const count = Math.max(0, parseInt(stat.value.replace(/,/g, '')) - 1);
            return { ...stat, value: count.toLocaleString() };
          }
          return stat;
        }));
        return;
      }
    } catch (e) {
      console.error("Error deleting local booking", e);
    }

    // 2. Try backend delete
    setRecentInquiries(prev => prev.filter(inq => inq.id !== bookingId));
  };

  useEffect(() => {
    async function loadDashboardData() {
      if (!currentUser) return;
      
      let views = 0;
      let inquiries = 0;
      let rating = 0.0;
      let reviewCount = 0;
      let foundRealData = false;
      let realInquiries: any[] = [];

      // 1. Try backend
      try {
        const apiURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
        
        const res = await axios.get(`${apiURL}/businesses/me/all`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        if (res.data?.success && res.data.data?.length > 0) {
          const businesses = res.data.data;
          setBusinessId(businesses[0]._id);
          setBusinessSlug(businesses[0].slug);
          views = businesses.reduce((sum: number, b: any) => sum + (b.views || 0), 0);
          rating = businesses[0].rating || 0;
          reviewCount = businesses[0].reviewCount || 0;
          
          let backendBookings: any[] = [];
          try {
            const bookingsRes = await axios.get(`${apiURL}/bookings/business/${businesses[0]._id}`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            if (bookingsRes.data?.success) {
              const bookings = bookingsRes.data.data;
              inquiries = bookings.length;
              backendBookings = bookings.map((b: any, idx: number) => ({
                id: b._id || idx,
                name: b.customerName,
                subject: `Appointment for ${b.serviceName}`,
                time: new Date(b.date).toLocaleDateString(),
                status: b.status || 'pending',
                phone: b.customerPhone,
                timeSlot: b.timeSlot,
                price: b.totalPrice,
                notes: b.notes,
                type: 'booking',
                createdAt: b.createdAt || new Date(b.date).toISOString()
              }));
            }
          } catch (e) {
            console.warn("Could not load bookings for stats", e);
          }

          let backendReviews: any[] = [];
          try {
            const reviewsRes = await axios.get(`${apiURL}/businesses/${businesses[0]._id}/reviews`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            if (reviewsRes.data?.success) {
              backendReviews = (reviewsRes.data.data || []).map((r: any) => ({
                id: r._id || `rev-${Math.random()}`,
                name: r.authorName || (r.author?.name) || "Anonymous",
                subject: `Comment: "${r.comment}"`,
                time: new Date(r.createdAt).toLocaleDateString(),
                status: r.status || 'approved',
                phone: '',
                timeSlot: '',
                price: 0,
                notes: r.comment,
                rating: r.rating,
                type: 'review',
                createdAt: r.createdAt,
                reportedReason: r.reportedReason,
                adminReply: r.adminReply
              }));
            }
          } catch (e) {
            console.warn("Could not load reviews for stats", e);
          }

          const combined = [...backendBookings, ...backendReviews];
          combined.sort((a: any, b: any) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
          realInquiries = combined;
          foundRealData = true;
        }
      } catch (err) {
        console.warn("Backend stats fetch failed, falling back to localStorage", err);
      }

      // 2. LocalStorage Fallback
      if (!foundRealData) {
        const mockProfile = getBusinessProfile(currentUser.username) as any;
        if (mockProfile) {
          const slug = mockProfile.businessName ? mockProfile.businessName.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]/g, "") : "";
          setBusinessId(`custom-${currentUser.username}`);
          setBusinessSlug(slug);
          views = mockProfile.viewCount !== undefined ? mockProfile.viewCount : 0;
          rating = mockProfile.ratingAvg !== undefined ? mockProfile.ratingAvg : 0.0;
          reviewCount = mockProfile.reviewCount !== undefined ? mockProfile.reviewCount : 0;
          
          let localInquiries: any[] = [];
          try {
            const localBookings = JSON.parse(window.localStorage.getItem("armbiz-local-bookings") || "[]");
            const targetBusinessId = `custom-${currentUser.username}`;
            const businessBookings = localBookings.filter((b: any) => b.businessId === targetBusinessId);
            
            inquiries = businessBookings.length;
            
            localInquiries = businessBookings.map((b: any, idx: number) => ({
              id: b.id || idx,
              name: b.customerName,
              subject: `Appointment for ${b.serviceName}`,
              time: new Date(b.date).toLocaleDateString(),
              status: b.status || 'pending',
              phone: b.customerPhone,
              timeSlot: b.timeSlot,
              price: b.totalPrice,
              notes: b.notes,
              type: 'booking',
              createdAt: b.createdAt || new Date(b.date).toISOString()
            }));
          } catch (e) {
            console.error("Error loading local bookings", e);
          }

          let localReviews: any[] = [];
          try {
            const rawReviews = window.localStorage.getItem(`armbiz-reviews-${slug}`);
            if (rawReviews) {
              const reviewsParsed = JSON.parse(rawReviews);
              
              if (reviewsParsed.length > 0) {
                reviewCount = reviewsParsed.length;
                const totalRating = reviewsParsed.reduce((sum: number, r: any) => sum + (Number(r.rating) || 0), 0);
                rating = totalRating / reviewsParsed.length;
              }
              
              localReviews = reviewsParsed.map((r: any, idx: number) => ({
                id: r._id || idx,
                name: r.authorName || "Anonymous",
                subject: `Comment: "${r.comment}"`,
                time: new Date(r.createdAt).toLocaleDateString(),
                status: r.status || 'approved',
                phone: '',
                timeSlot: '',
                price: 0,
                notes: r.comment,
                rating: r.rating,
                type: 'review',
                createdAt: r.createdAt,
                reportedReason: r.reportedReason,
                adminReply: r.adminReply
              }));
            }
          } catch (e) {
            console.error("Error loading local reviews", e);
          }

          const combined = [...localInquiries, ...localReviews];
          combined.sort((a: any, b: any) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
          realInquiries = combined;
        } else {
          // Default to ArmTech Solutions mock stats (first listing in directory)
          setBusinessId("1");
          setBusinessSlug("armtech-solutions");
          const mockViewsKey = "armbiz-mock-views";
          let trackedViews = 3420;
          try {
            const mockViewsMap = JSON.parse(window.localStorage.getItem(mockViewsKey) || "{}");
            if (mockViewsMap["armtech-solutions"] !== undefined) {
              trackedViews = mockViewsMap["armtech-solutions"];
            }
          } catch (e) {}

          const mockInqKey = "armbiz-mock-inquiries";
          let trackedInqs = 89;
          try {
            const mockInqMap = JSON.parse(window.localStorage.getItem(mockInqKey) || "{}");
            if (mockInqMap["armtech-solutions"] !== undefined) {
              trackedInqs = mockInqMap["armtech-solutions"];
            }
          } catch (e) {}

          const mockReviewKey = "armbiz-mock-reviews";
          let trackedRating = 4.8;
          let trackedReviewsCount = 47;
          try {
            const mockReviewsMap = JSON.parse(window.localStorage.getItem(mockReviewKey) || "{}");
            if (mockReviewsMap["armtech-solutions"] !== undefined) {
              trackedRating = mockReviewsMap["armtech-solutions"].ratingAvg;
              trackedReviewsCount = mockReviewsMap["armtech-solutions"].reviewCount;
            }
          } catch (e) {}

          // Load local bookings for ArmTech Solutions (ID "1")
          let localInquiries: any[] = [];
          try {
            const localBookings = JSON.parse(window.localStorage.getItem("armbiz-local-bookings") || "[]");
            const businessBookings = localBookings.filter((b: any) => b.businessId === "1");
            
            trackedInqs = trackedInqs + businessBookings.length;
            
            localInquiries = businessBookings.map((b: any, idx: number) => ({
              id: b.id || idx,
              name: b.customerName,
              subject: `Appointment for ${b.serviceName}`,
              time: new Date(b.date).toLocaleDateString(),
              status: b.status || 'pending',
              phone: b.customerPhone,
              timeSlot: b.timeSlot,
              price: b.totalPrice,
              notes: b.notes,
              type: 'booking',
              createdAt: b.createdAt || new Date(b.date).toISOString()
            }));
          } catch (e) {}

          // Load local reviews for ArmTech Solutions
          let localReviews: any[] = [];
          try {
            const rawReviews = window.localStorage.getItem(`armbiz-reviews-armtech-solutions`);
            if (rawReviews) {
              const reviewsParsed = JSON.parse(rawReviews);
              
              if (reviewsParsed.length > 0) {
                const totalRating = reviewsParsed.reduce((sum: number, r: any) => sum + (Number(r.rating) || 0), 0);
                const combinedRating = (trackedRating * trackedReviewsCount + totalRating) / (trackedReviewsCount + reviewsParsed.length);
                trackedRating = combinedRating;
                trackedReviewsCount = trackedReviewsCount + reviewsParsed.length;
              }
              
              localReviews = reviewsParsed.map((r: any, idx: number) => ({
                id: r._id || idx,
                name: r.authorName || "Anonymous",
                subject: `Comment: "${r.comment}"`,
                time: new Date(r.createdAt).toLocaleDateString(),
                status: r.status || 'approved',
                phone: '',
                timeSlot: '',
                price: 0,
                notes: r.comment,
                rating: r.rating,
                type: 'review',
                createdAt: r.createdAt,
                reportedReason: r.reportedReason,
                adminReply: r.adminReply
              }));
            }
          } catch (e) {}

          views = trackedViews;
          inquiries = trackedInqs;
          rating = trackedRating;
          reviewCount = trackedReviewsCount;
          
          const combined = [...localInquiries, ...localReviews];
          combined.sort((a: any, b: any) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
          
          const defaultInqsMapped = DEFAULT_INQUIRIES.map(i => ({ ...i, createdAt: new Date().toISOString() }));
          realInquiries = [...combined, ...defaultInqsMapped].slice(0, 4);
        }
      }

      const rankVal = views > 0 ? `#${Math.max(1, 15 - Math.floor(views / 10))}` : "#0";
      const changeVal = views > 0 ? `+${Math.floor(views / 5)}` : "+0";

      setStats([
        { label: "Total Views", value: views.toLocaleString(), change: views > 0 ? `+${(views * 0.125).toFixed(1)}%` : "+0%", icon: Eye },
        { label: "Inquiries", value: inquiries.toLocaleString(), change: inquiries > 0 ? `+${(inquiries * 0.082).toFixed(1)}%` : "+0%", icon: MessageSquare },
        { label: "Avg. Rating", value: `${rating.toFixed(1)} (${reviewCount} review${reviewCount !== 1 ? 's' : ''})`, change: rating > 0 ? `+${(rating * 0.041).toFixed(1)}` : "+0.0", icon: Star },
        { label: "Profile Rank", value: rankVal, change: changeVal, icon: TrendingUp },
      ]);
      setRecentInquiries(realInquiries);
      setLoading(false);
    }
    loadDashboardData();
  }, [currentUser]);

  return (
    <ProtectedRoute>
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">Dashboard</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Welcome back, {displayName}! Here&apos;s your business overview.</p>
          </div>
          <DashboardPublish />
        </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div 
            key={stat.label} 
            className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">
                <stat.icon className="h-4 w-4" />
              </div>
              <span className="flex items-center gap-0.5 text-xs font-medium text-green-600">
                {stat.change} <ArrowUpRight className="h-3 w-3" />
              </span>
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>
 
      {/* Recent inquiries */}
      <div 
        id="recent-inquiries-section" 
        className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] transition-all duration-500 origin-center"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-5 border-b border-[hsl(var(--border))] gap-3">
          <h2 className="text-sm font-semibold">Recent Activity & Feedback</h2>
          <div className="flex gap-1.5 text-xs bg-[hsl(var(--muted))]/50 p-1 rounded-xl self-start sm:self-center">
            <button 
              onClick={() => setActiveTab('all')} 
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'all' 
                  ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm' 
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] bg-transparent'
              }`}
            >
              All
            </button>
            <button 
              onClick={() => setActiveTab('bookings')} 
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'bookings' 
                  ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm' 
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] bg-transparent'
              }`}
            >
              Bookings
            </button>
            <button 
              onClick={() => setActiveTab('reviews')} 
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'reviews' 
                  ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm' 
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] bg-transparent'
              }`}
            >
              Reviews
            </button>
          </div>
        </div>
        <div className="divide-y divide-[hsl(var(--border))]">
          {recentInquiries
            .filter((inq) => {
              if (activeTab === 'bookings') return inq.type === 'booking';
              if (activeTab === 'reviews') return inq.type === 'review';
              return true;
            })
            .map((inq) => (
              <div key={inq.id} className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 hover:bg-[hsl(var(--muted))]/50 transition-colors gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold">{inq.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      inq.type === "review" 
                        ? inq.status === "reported" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse"
                          : inq.status === "resolved_kept" ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                          : inq.status === "resolved_deleted" ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        : inq.status === "pending" || inq.status === "new" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                        : inq.status === "confirmed" || inq.status === "replied" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : inq.status === "cancelled" ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    }`}>
                      {inq.type === "review" ? `Review${inq.status && inq.status !== 'approved' && inq.status !== 'read' ? ` (${inq.status})` : ''}` : inq.status}
                    </span>
                    {inq.type === "review" && inq.rating && (
                      <span className="flex gap-0.5 ml-1 text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-3.5 w-3.5 ${i < Math.round(inq.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} 
                          />
                        ))}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-[hsl(var(--foreground))] mb-2">{inq.subject}</p>
                  
                  {/* Detailed Information (Bookings vs Reviews) */}
                  {inq.type === "booking" && (inq.phone || inq.timeSlot || inq.price || inq.notes) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))]/30 p-2.5 rounded-xl border border-[hsl(var(--border))]/40 max-w-xl">
                      {inq.phone && (
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-[hsl(var(--foreground))]">Phone:</span>
                          <span>{inq.phone}</span>
                        </div>
                      )}
                      {inq.timeSlot && (
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-[hsl(var(--foreground))]">Time Slot:</span>
                          <span>{inq.timeSlot}</span>
                        </div>
                      )}
                      {inq.price !== undefined && inq.price > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-[hsl(var(--foreground))]">Price:</span>
                          <span className="text-emerald-600 font-medium">{inq.price.toLocaleString()} AMD</span>
                        </div>
                      )}
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
                      
                      {inq.status === 'reported' && (
                        <div className="mt-2 text-[10px] text-amber-600 bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-200/30 flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          <span>Reported: &ldquo;{inq.reportedReason}&rdquo; (Under Review)</span>
                        </div>
                      )}
                      {inq.status === 'resolved_kept' && (
                        <div className="mt-2 text-[10px] text-green-600 bg-green-500/10 px-2.5 py-1.5 rounded-lg border border-green-200/30">
                          <div className="font-semibold mb-0.5">Moderator Decision: Kept</div>
                          <p className="italic">&ldquo;{inq.adminReply || "No message provided."}&rdquo;</p>
                        </div>
                      )}
                      {inq.status === 'resolved_deleted' && (
                        <div className="mt-2 text-[10px] text-red-600 bg-red-500/10 px-2.5 py-1.5 rounded-lg border border-red-200/30">
                          <div className="font-semibold mb-0.5">Moderator Decision: Deleted</div>
                          <p className="italic">&ldquo;{inq.adminReply || "No message provided."}&rdquo;</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0 self-start sm:self-center">
                  <span className="text-xs text-[hsl(var(--muted-foreground))] font-medium">{inq.time}</span>
                  {inq.type === "booking" && (
                    <div className="flex gap-1.5 mt-1">
                      {inq.status !== 'confirmed' && inq.status !== 'replied' && (
                        <button 
                          onClick={() => handleUpdateStatus(inq.id, 'confirmed')} 
                          className="px-2.5 py-1 text-[10px] font-semibold bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all shadow-sm cursor-pointer"
                        >
                          Confirm
                        </button>
                      )}
                      {inq.status !== 'cancelled' && (
                        <button 
                          onClick={() => handleUpdateStatus(inq.id, 'cancelled')} 
                          className="px-2.5 py-1 text-[10px] font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all shadow-sm cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteBooking(inq.id)} 
                        className="px-2.5 py-1 text-[10px] font-semibold bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all shadow-sm cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                  {inq.type === "review" && (
                    <div className="flex gap-1.5 mt-1">
                      {(!inq.status || inq.status === 'approved' || inq.status === 'read') && (
                        <button 
                          onClick={() => handleOpenReportModal(inq.id)}
                          className="px-2.5 py-1 text-[10px] font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all shadow-sm cursor-pointer"
                        >
                          Report Review
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          {recentInquiries.filter((inq) => {
            if (activeTab === 'bookings') return inq.type === 'booking';
            if (activeTab === 'reviews') return inq.type === 'review';
            return true;
          }).length === 0 && (
            <div className="p-8 text-center text-xs text-[hsl(var(--muted-foreground))]">
              {activeTab === 'bookings' ? "No recent bookings." : activeTab === 'reviews' ? "No recent reviews." : "No recent activity."}
            </div>
          )}
        </div>
      </div>

      {/* Report Review Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all duration-300">
          <div className="relative w-full max-w-md bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200 animate-duration-150">
            <h3 className="text-base font-bold text-[hsl(var(--foreground))] mb-2">Report Review</h3>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-4">
              Please provide a detailed reason why you want this review reported. Site administrators will inspect the content.
            </p>
            
            {reportError && (
              <div className="mb-4 text-xs text-red-600 bg-red-500/10 p-2.5 rounded-xl border border-red-200/30">
                {reportError}
              </div>
            )}
            
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Reason *</label>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Explain why this review violates platform rules (e.g. spam, hate speech, incorrect details, offensive language, etc.)"
                rows={4}
                className="w-full text-xs rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/10 p-3 outline-none transition-colors focus:border-[hsl(var(--primary))]"
                required
              />
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={handleCloseReportModal}
                disabled={isSubmittingReport}
                className="px-3.5 py-2 text-xs font-medium rounded-xl border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]/50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReport}
                disabled={isSubmittingReport || reportReason.trim().length < 5}
                className="px-3.5 py-2 text-xs font-medium rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isSubmittingReport ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </ProtectedRoute>
  );
}
