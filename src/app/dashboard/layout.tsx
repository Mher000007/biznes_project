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
  CreditCard,
  PanelLeftClose,
  PanelLeftOpen,
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
    { href: "/dashboard/billing", label: navT.billing || "Billing & Plans", icon: CreditCard },
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
        <aside className={`hidden lg:flex fixed top-14 left-0 bottom-0 flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] z-40 transition-all duration-300 ${isSidebarCollapsed ? "w-16" : "w-64"}`}>
          <div className="flex flex-col flex-1 p-4 gap-1 pt-6">
            <div className={`flex items-center mb-3 transition-all duration-300 ${isSidebarCollapsed ? "px-1" : "px-3"}`}>
              <div className={`overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? "max-w-0 opacity-0" : "max-w-[120px] flex-1 opacity-100"}`}>
                <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider whitespace-nowrap">
                  Dashboard
                </p>
              </div>
              <button 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-1 rounded-md hover:bg-emerald-500/10 text-emerald-500 transition-colors"
                title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {isSidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </button>
            </div>
            {links.map((link) => {
              const isLocked = isStarterPlan && link.isPro;
              const isShaking = shakingHrefs.includes(link.href);

              if (link.href === "/dashboard/profile") {
                const isProfileActive = pathname.startsWith("/dashboard/profile");
                return (
                  <div key={link.href} className="flex flex-col gap-1">
                    <button
                      onClick={() => !isSidebarCollapsed && setProfileExpanded(!profileExpanded)}
                      className={`group relative flex items-center w-full rounded-lg py-2.5 text-sm font-medium transition-all duration-300 cursor-pointer text-left ${isSidebarCollapsed ? "px-2" : "px-3"} ${isProfileActive
                          ? "bg-[hsl(var(--primary))]/5 text-[hsl(var(--primary))]"
                          : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                        }`}
                    >
                      <link.icon className="h-4 w-4 shrink-0" />
                      <div className={`flex items-center justify-between overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? "max-w-0 opacity-0" : "max-w-[200px] opacity-100 ml-3 flex-1"}`}>
                        <span className="truncate">{link.label}</span>
                        {profileExpanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                      </div>
                      {isSidebarCollapsed && (
                        <div className="absolute left-full top-0 pl-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl shadow-xl flex flex-col overflow-hidden w-48 text-[hsl(var(--foreground))]">
                            <div className="px-3 py-2 font-semibold text-xs border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30">
                              {link.label}
                            </div>
                            <div className="flex flex-col p-1.5 gap-0.5">
                              {profileSubLinks.map((sub) => {
                                const active = isSubActive(sub.href);
                                const isSubLocked = isStarterPlan && sub.isPro;
                                return (
                                  <Link
                                    key={sub.href}
                                    href={sub.href}
                                    onClick={(e) => isSubLocked && handleLockedClick(e, sub.href)}
                                    className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
                                      isSubLocked
                                        ? "text-[hsl(var(--muted-foreground))]/70 hover:bg-amber-500/10 cursor-pointer"
                                        : active
                                          ? "text-[hsl(var(--primary))] font-semibold bg-[hsl(var(--primary))]/10"
                                          : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                                    }`}
                                  >
                                    <sub.icon className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate">{sub.label}</span>
                                    {isSubLocked && <Lock className="h-3 w-3 text-amber-500 shrink-0 ml-auto" />}
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </button>

                    {!isSidebarCollapsed && profileExpanded && (
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
                  className={`group relative flex items-center rounded-lg py-2.5 text-sm font-medium transition-all duration-300 ${isSidebarCollapsed ? "px-2" : "px-3"} ${isLocked
                      ? "text-[hsl(var(--muted-foreground))]/70 hover:bg-amber-500/10 cursor-pointer"
                      : isActive
                        ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
                        : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                    }`}
                >
                  <link.icon className="h-4 w-4 shrink-0" />
                  <div className={`flex items-center justify-between overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? "max-w-0 opacity-0" : "max-w-[200px] opacity-100 ml-3 flex-1"}`}>
                    <span className="truncate">{link.label}</span>
                    {isLocked ? (
                      <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    ) : (
                      link.href === "/dashboard/inquiries" && unreadCount > 0 && (
                        <div className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold shadow-sm">
                          {unreadCount}
                        </div>
                      )
                    )}
                  </div>
                  {isSidebarCollapsed && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-2.5 py-1.5 bg-[hsl(var(--foreground))] text-[hsl(var(--background))] text-xs font-semibold rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-md">
                      {link.label}
                      {isLocked && <span className="ml-1 text-amber-500">(Locked)</span>}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
          <div className="p-4 border-t border-[hsl(var(--border))]">
            <button
              onClick={handleSignOut}
              className={`group relative flex w-full items-center rounded-lg py-2.5 text-sm font-medium text-[hsl(var(--muted-foreground))] transition-all duration-300 hover:bg-[hsl(var(--muted))] hover:text-red-500 cursor-pointer ${isSidebarCollapsed ? "px-2" : "px-3"}`}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <div className={`overflow-hidden transition-all duration-300 whitespace-nowrap ${isSidebarCollapsed ? "max-w-0 opacity-0" : "max-w-[200px] opacity-100 ml-3 text-left"}`}>
                Sign Out
              </div>
              {isSidebarCollapsed && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-2.5 py-1.5 bg-[hsl(var(--foreground))] text-[hsl(var(--background))] text-xs font-semibold rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-md">
                  Sign Out
                </div>
              )}
            </button>
          </div>
        </aside>

        {/* Content */}
        <div className={`flex-1 min-w-0 p-6 lg:p-8 transition-all duration-300 ${isSidebarCollapsed ? "lg:ml-16" : "lg:ml-64"}`}>
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
