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

const DEFAULT_INQUIRIES = [
  { id: 1, name: "Armen Grigoryan", subject: "Partnership inquiry", time: "2 hours ago", status: "new" },
  { id: 2, name: "Seda Hovhannisyan", subject: "Service pricing", time: "5 hours ago", status: "read" },
  { id: 3, name: "David Mkrtchyan", subject: "Collaboration proposal", time: "1 day ago", status: "replied" },
  { id: 4, name: "Anna Petrosyan", subject: "Custom solution request", time: "2 days ago", status: "new" },
];

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const displayName = currentUser?.displayName || currentUser?.username || "User";
  
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [recentInquiries, setRecentInquiries] = useState(DEFAULT_INQUIRIES);
  const [loading, setLoading] = useState(true);

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
          views = businesses.reduce((sum: number, b: any) => sum + (b.views || 0), 0);
          rating = businesses[0].rating || 0;
          reviewCount = businesses[0].reviewCount || 0;
          
          try {
            const bookingsRes = await axios.get(`${apiURL}/bookings/business/${businesses[0]._id}`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            if (bookingsRes.data?.success) {
              const bookings = bookingsRes.data.data;
              inquiries = bookings.length;
              if (bookings.length > 0) {
                realInquiries = bookings.slice(0, 4).map((b: any, idx: number) => ({
                  id: b._id || idx,
                  name: b.customerName,
                  subject: `Appointment for ${b.serviceName}`,
                  time: new Date(b.date).toLocaleDateString(),
                  status: b.status === 'pending' ? 'new' : b.status === 'confirmed' ? 'replied' : 'read'
                }));
              } else {
                realInquiries = [];
              }
            }
          } catch (e) {
            console.warn("Could not load bookings for stats", e);
          }
          foundRealData = true;
        }
      } catch (err) {
        console.warn("Backend stats fetch failed, falling back to localStorage", err);
      }

      // 2. LocalStorage Fallback
      if (!foundRealData) {
        const mockProfile = getBusinessProfile(currentUser.username) as any;
        if (mockProfile) {
          views = mockProfile.viewCount !== undefined ? mockProfile.viewCount : 0;
          inquiries = mockProfile.inquiryCount !== undefined ? mockProfile.inquiryCount : 0;
          rating = mockProfile.ratingAvg !== undefined ? mockProfile.ratingAvg : 0.0;
          reviewCount = mockProfile.reviewCount !== undefined ? mockProfile.reviewCount : 0;
          realInquiries = [];
        } else {
          // Default to ArmTech Solutions mock stats (first listing in directory)
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

          views = trackedViews;
          inquiries = trackedInqs;
          rating = trackedRating;
          reviewCount = trackedReviewsCount;
          realInquiries = DEFAULT_INQUIRIES;
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
          <div key={stat.label} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
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
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <div className="flex items-center justify-between p-5 border-b border-[hsl(var(--border))]">
          <h2 className="text-sm font-semibold">Recent Inquiries</h2>
          <span className="text-xs text-[hsl(var(--primary))] font-medium cursor-pointer hover:underline">View all</span>
        </div>
        <div className="divide-y divide-[hsl(var(--border))]">
          {recentInquiries.map((inq) => (
            <div key={inq.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-[hsl(var(--muted))]/50 transition-colors">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{inq.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    inq.status === "new" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" :
                    inq.status === "replied" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" :
                    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  }`}>
                    {inq.status}
                  </span>
                </div>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{inq.subject}</p>
              </div>
              <span className="text-xs text-[hsl(var(--muted-foreground))] shrink-0 ml-4">{inq.time}</span>
            </div>
          ))}
          {recentInquiries.length === 0 && (
            <div className="p-8 text-center text-xs text-[hsl(var(--muted-foreground))]">
              No recent inquiries.
            </div>
          )}
        </div>
      </div>
    </div>
  </ProtectedRoute>
  );
}
