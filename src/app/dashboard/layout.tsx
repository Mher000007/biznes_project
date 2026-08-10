"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { useState, useEffect, Suspense } from "react";
import api from "@/lib/api";
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
  Utensils,
  ArrowRightLeft,
  QrCode,
} from "lucide-react";
import UnverifiedBanner from "@/components/dashboard/UnverifiedBanner";

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, isLoading, logout } = useAuth();
  const { t } = useI18n();

  const [profileExpanded, setProfileExpanded] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activePlan, setActivePlan] = useState<string>("starter");
  const [shakingHrefs, setShakingHrefs] = useState<string[]>([]);

  // 1. Unverified route guard effect
  useEffect(() => {
    if (!isLoading && currentUser && currentUser.verified === false) {
      router.push("/verify-pending");
    }
  }, [currentUser, isLoading, router]);

  // 2. Profile tab expansion effect
  useEffect(() => {
    if (pathname.startsWith("/dashboard/profile")) {
      setProfileExpanded(true);
    }
  }, [pathname]);

  // 3. Unread notification & booking count effect
  useEffect(() => {
    async function fetchUnread() {
      if (!currentUser || currentUser.verified === false) return;
      try {
        let count = 0;

        // Fetch notifications
        try {
          const res = await api.get("/notifications");
          if (res.data?.success) {
            count += (res.data.data || []).filter((n: any) => !n.readBy?.includes(currentUser.id)).length;
          }
        } catch { }

        // Fetch pending bookings
        try {
          const bizRes = await api.get("/businesses/me/all");
          if (bizRes.data?.success && bizRes.data.data?.length > 0) {
            const bizId = bizRes.data.data[0]._id;
            const bookRes = await api.get(`/bookings/business/${bizId}`);
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

  // 4. Subscription plan loading effect
  useEffect(() => {
    async function loadPlan() {
      if (!currentUser || currentUser.verified === false) return;
      try {
        const bizRes = await api.get("/businesses/me/all");
        if (bizRes.data?.success && bizRes.data.data?.length > 0) {
          const bizId = bizRes.data.data[0]._id;
          try {
            const subRes = await api.get(`/subscriptions/business/${bizId}`);
            if (subRes.data?.success && subRes.data.data?.plan) {
              setActivePlan(subRes.data.data.plan);
              return;
            }
          } catch { }
        }
      } catch { }

      if (typeof window !== "undefined") {
        const profilesStr = window.localStorage.getItem("armbiz-business-profiles");
        if (profilesStr) {
          try {
            const profiles = JSON.parse(profilesStr);
            const myProfile = profiles.find((p: any) => p.ownerUsername === currentUser?.username);
            if (myProfile && myProfile.plan) {
              setActivePlan(myProfile.plan);
            }
          } catch (e) { }
        }
      }
    }
    loadPlan();
    
    // Listen for custom plan update event from the dashboard
    const handlePlanUpdate = () => {
      const demoPlan = window.localStorage.getItem("demo_active_plan");
      if (demoPlan) setActivePlan(demoPlan);
    };
    
    // Also check demo_active_plan on initial mount
    handlePlanUpdate();

    window.addEventListener("plan_updated", handlePlanUpdate);
    return () => window.removeEventListener("plan_updated", handlePlanUpdate);
  }, [currentUser]);

  // ── CONDITIONAL EARLY RETURNS (ALL HOOKS HAVE BEEN CALLED ABOVE) ──────────

  if (isLoading) {
    return <div className="pt-24 p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">Loading...</div>;
  }

  if (currentUser?.verified === false) {
    return null;
  }

  // ── DERIVED VALUES & EVENT HANDLERS ───────────────────────────────────────

  const currentTab = searchParams.get("tab") || "branding";

  const handleSignOut = () => {
    logout();
    router.push("/");
  };

  const isStarterPlan = !activePlan || activePlan === "starter" || activePlan === "start" || activePlan === "free" || activePlan === "basic";

  const handleLockedClick = (e: React.MouseEvent, href: string) => {
    if (isStarterPlan) {
      e.preventDefault();
      e.stopPropagation();
      setShakingHrefs((prev) => [...prev, href]);
      setTimeout(() => {
        setShakingHrefs((prev) => prev.filter((h) => h !== href));
      }, 500);
    }
  };

  const navT = (t as any).dashboard?.nav || {};

  const links = [
    { href: "/dashboard", label: navT.overview || "Overview", icon: LayoutDashboard },
    { href: "/dashboard/profile", label: navT.businessProfile || "Business Profile", icon: Building2 },
    { href: "/dashboard/offers", label: navT.menusOffers || "Menus & Offers", icon: Utensils, isPro: true },
    { href: "/dashboard/locations", label: navT.myLocations || "My Locations", icon: MapPin },
    { href: "/dashboard/stories", label: navT.stories || "Stories", icon: Sparkles, isPro: true },
    { href: "/dashboard/inquiries", label: navT.inquiries || "Inquiries", icon: MessageSquare },
    { href: "/dashboard/exchange", label: navT.exchange || "Exchange", icon: ArrowRightLeft, isPro: true },
    { href: "/dashboard/qr-scanner", label: navT.qrScanner || "QR Scanner", icon: QrCode, isPro: true },
    { href: "/dashboard/support", label: navT.supportChat || "Support Chat", icon: HeadphonesIcon },
    { href: "/dashboard/settings", label: navT.settings || "Settings", icon: Settings },
  ];

  const profileSubLinks = [
    { href: "/dashboard/profile?tab=branding", label: navT.branding || "Branding", icon: Sparkles },
    { href: "/dashboard/profile?tab=credentials", label: navT.credentials || "Credentials", icon: Lock },
    { href: "/dashboard/profile?tab=stories", label: navT.storiesHighlights || "Stories & Highlights", icon: Camera, isPro: true },
    { href: "/dashboard/profile?tab=hours", label: navT.operatingHours || "Operating Hours", icon: Clock },
  ];

  const isSubActive = (href: string) => {
    const url = new URL(href, "http://localhost");
    const tabParam = url.searchParams.get("tab");
    return pathname === url.pathname && currentTab === tabParam;
  };

  if (currentUser && (currentUser.accountType === "personal" || currentUser.role === "user")) {
    return (
      <div className="pt-16 min-h-screen flex flex-col">
        <UnverifiedBanner />
        <div className="flex-1">{children}</div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen flex flex-col">
      <UnverifiedBanner />
      <div className="flex flex-1">
        <style jsx global>{`
        @keyframes planLockShake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-4px); }
          40%, 80% { transform: translateX(4px); }
        }
      `}</style>
        {/* Sidebar */}
        <aside className="hidden lg:flex fixed top-14 left-0 bottom-0 w-64 flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] z-40">
          <div className="flex flex-col flex-1 p-4 gap-1 pt-6">
            <p className="px-3 mb-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Dashboard</p>
            {links.map((link) => {
              const isLocked = isStarterPlan && link.isPro;
              const isShaking = shakingHrefs.includes(link.href);

              if (link.href === "/dashboard/profile") {
                const isProfileActive = pathname.startsWith("/dashboard/profile");
                return (
                  <div key={link.href} className="flex flex-col gap-1">
                    <button
                      onClick={() => setProfileExpanded(!profileExpanded)}
                      className={`flex items-center justify-between w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer text-left ${isProfileActive
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
                          const isSubLocked = isStarterPlan && sub.isPro;
                          const isSubShaking = shakingHrefs.includes(sub.href);

                          return (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              onClick={(e) => isSubLocked && handleLockedClick(e, sub.href)}
                              style={isSubShaking ? { animation: "planLockShake 0.4s ease-in-out" } : undefined}
                              title={isSubLocked ? "Pro & Premium feature — Locked on Starter Plan" : undefined}
                              className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${isSubLocked
                                  ? "text-[hsl(var(--muted-foreground))]/70 hover:bg-amber-500/10 cursor-pointer"
                                  : active
                                    ? "text-[hsl(var(--primary))] font-semibold bg-[hsl(var(--primary))]/5"
                                    : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/50 hover:text-[hsl(var(--foreground))]"
                                }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <sub.icon className="h-3 w-3 shrink-0" />
                                <span className="truncate">{sub.label}</span>
                              </div>
                              {isSubLocked && <Lock className="h-3 w-3 text-amber-500 shrink-0" />}
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
                  onClick={(e) => isLocked && handleLockedClick(e, link.href)}
                  style={isShaking ? { animation: "planLockShake 0.4s ease-in-out" } : undefined}
                  title={isLocked ? "Pro & Premium feature — Locked on Starter Plan" : undefined}
                  className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isLocked
                      ? "text-[hsl(var(--muted-foreground))]/70 hover:bg-amber-500/10 cursor-pointer"
                      : isActive
                        ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
                        : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </div>
                  {isLocked ? (
                    <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  ) : (
                    link.href === "/dashboard/inquiries" && unreadCount > 0 && (
                      <div className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold shadow-sm">
                        {unreadCount}
                      </div>
                    )
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
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading dashboard...</div>}>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </Suspense>
  );
}
