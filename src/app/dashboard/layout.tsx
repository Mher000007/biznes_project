"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import axios from "axios";
import { getApiUrl } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  MessageSquare,
  Settings,
  LogOut,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Lock,
  Camera,
  Clock,
  MapPin,
  Calendar,
  HeadphonesIcon,
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, logout } = useAuth();

  const [profileExpanded, setProfileExpanded] = useState(true);

  const currentTab = searchParams.get("tab") || "branding";

  const handleSignOut = () => {
    logout();
    router.push("/");
  };

  useEffect(() => {
    if (pathname.startsWith("/dashboard/profile")) {
      setProfileExpanded(true);
    }
  }, [pathname]);

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function fetchUnread() {
      if (!currentUser) return;
      try {
        const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
        if (!token) return;
        
        let count = 0;

        // Fetch notifications
        try {
          const res = await axios.get(`${getApiUrl()}/notifications`, { headers: { Authorization: `Bearer ${token}` } });
          if (res.data?.success) {
            count += (res.data.data || []).filter((n: any) => !n.readBy?.includes(currentUser.id)).length;
          }
        } catch { }

        // Fetch pending bookings
        try {
          const bizRes = await axios.get(`${getApiUrl()}/businesses/me/all`, { headers: { Authorization: `Bearer ${token}` } });
          if (bizRes.data?.success && bizRes.data.data?.length > 0) {
            const bizId = bizRes.data.data[0]._id;
            const bookRes = await axios.get(`${getApiUrl()}/bookings/business/${bizId}`, { headers: { Authorization: `Bearer ${token}` } });
            if (bookRes.data?.success) {
              count += (bookRes.data.data || []).filter((b: any) => b.status === "pending" || b.status === "new").length;
            }
          }
        } catch { }

        setUnreadCount(count);
      } catch { }
    }
    fetchUnread();
  }, [pathname, currentUser]);

  const links = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
    { href: "/dashboard/profile", label: "Business Profile", icon: Building2 },
    { href: "/dashboard/locations", label: "My Locations", icon: MapPin },
    { href: "/dashboard/stories", label: "Stories", icon: Sparkles },
    { href: "/dashboard/inquiries", label: "Inquiries", icon: MessageSquare },
    { href: "/dashboard/support", label: "Support Chat", icon: HeadphonesIcon },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  const profileSubLinks = [
    { href: "/dashboard/profile?tab=branding", label: "Branding", icon: Sparkles },
    { href: "/dashboard/profile?tab=credentials", label: "Credentials", icon: Lock },
    { href: "/dashboard/profile?tab=stories", label: "Stories & Highlights", icon: Camera },
    { href: "/dashboard/profile?tab=hours", label: "Operating Hours", icon: Clock },
  ];

  const isSubActive = (href: string) => {
    const url = new URL(href, "http://localhost");
    const tabParam = url.searchParams.get("tab");
    return pathname === url.pathname && currentTab === tabParam;
  };

  return (
    <div className="pt-16 min-h-screen flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex fixed top-14 left-0 bottom-0 w-64 flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] z-40">
        <div className="flex flex-col flex-1 p-4 gap-1 pt-6">
          <p className="px-3 mb-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Dashboard</p>
          {links.map((link) => {
            if (link.href === "/dashboard/profile") {
              const isProfileActive = pathname.startsWith("/dashboard/profile");
              return (
                <div key={link.href} className="flex flex-col gap-1">
                  <button
                    onClick={() => setProfileExpanded(!profileExpanded)}
                    className={`flex items-center justify-between w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer text-left ${
                      isProfileActive
                        ? "bg-[hsl(var(--primary))]/5 text-[hsl(var(--primary))]"
                        : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </div>
                    {profileExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  </button>

                  {profileExpanded && (
                    <div className="pl-6 flex flex-col gap-1 border-l border-[hsl(var(--border))]/60 ml-5 mt-1">
                      {profileSubLinks.map((sub) => {
                        const active = isSubActive(sub.href);
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                              active
                                ? "text-[hsl(var(--primary))] font-semibold bg-[hsl(var(--primary))]/5"
                                : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/50 hover:text-[hsl(var(--foreground))]"
                            }`}
                          >
                            <sub.icon className="h-3 w-3" />
                            {sub.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
                    : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </div>
                {link.href === "/dashboard/inquiries" && unreadCount > 0 && (
                  <div className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold shadow-sm">
                    {unreadCount}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
        <div className="p-4 border-t border-[hsl(var(--border))]">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--muted))] hover:text-red-500 cursor-pointer"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0 p-6 lg:p-8 lg:ml-64">
        {children}
      </div>
    </div>
  );
}
