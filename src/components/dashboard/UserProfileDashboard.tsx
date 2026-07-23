"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/i18n";
import { getApiUrl } from "@/lib/utils";
import axios from "axios";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Lock,
  Heart,
  Clock,
  Star,
  Building2,
  CheckCircle,
  Save,
  Key,
  ShieldCheck,
  LogOut,
  Camera,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Trash2,
  Search,
  Award,
  Shield,
  MessageSquare,
  Bookmark
} from "lucide-react";
import { MOCK_BUSINESSES } from "@/data/mock-businesses";

export default function UserProfileDashboard() {
  const { currentUser, logout, refreshUser } = useAuth();
  const { t, locale } = useI18n();

  const [activeTab, setActiveTab] = useState<"profile" | "favorites" | "bookings" | "reviews" | "security">("profile");

  // Profile Form States
  const [name, setName] = useState(currentUser?.name || "");
  const [username, setUsername] = useState(currentUser?.username || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const formatPhoneDigits = (raw: string) => {
    if (!raw) return "";
    const clean = raw.replace(/^\+374/, "").replace(/\D/g, "").slice(0, 8);
    return clean.match(/.{1,2}/g)?.join(" ") || "";
  };

  const [phone, setPhone] = useState(formatPhoneDigits(currentUser?.phone || ""));
  const [bio, setBio] = useState((currentUser as any)?.bio || "");
  const [avatar, setAvatar] = useState(currentUser?.avatar || "");
  const [location, setLocation] = useState((currentUser as any)?.location || "Yerevan, Armenia");

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Security Form States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Favorites, Bookings & Reviews States
  const [savedBusinesses, setSavedBusinesses] = useState<any[]>([]);
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [userReviewsCount, setUserReviewsCount] = useState<number>(0);
  const [userReviewsList, setUserReviewsList] = useState<any[]>([]);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setUsername(currentUser.username || "");
      setEmail(currentUser.email || "");
      setPhone(formatPhoneDigits(currentUser.phone || ""));
      setBio((currentUser as any)?.bio || "");
      setAvatar(currentUser.avatar || "");
      setLocation((currentUser as any)?.location || "Yerevan, Armenia");
    }
  }, [currentUser]);

  const loadFavorites = () => {
    if (typeof window === "undefined") return;
    try {
      const favStr = localStorage.getItem("armbiz_favorites");
      const itemsStr = localStorage.getItem("armbiz_favorites_items");

      const favIds: string[] = favStr ? JSON.parse(favStr) : [];
      const itemsMap: Record<string, any> = itemsStr ? JSON.parse(itemsStr) : {};

      if (favIds.length === 0) {
        setSavedBusinesses([]);
        return;
      }

      const list: any[] = [];
      const seen = new Set<string>();

      for (const key of favIds) {
        if (seen.has(key)) continue;

        // 1. Check cached items map
        if (itemsMap[key]) {
          list.push(itemsMap[key]);
          seen.add(key);
          continue;
        }

        // 2. Check MOCK_BUSINESSES
        const mockMatch = MOCK_BUSINESSES.find(b => b.id === key || b.slug === key);
        if (mockMatch) {
          list.push(mockMatch);
          seen.add(key);
          continue;
        }

        // 3. Check custom local profiles
        const profilesStr = localStorage.getItem("armbiz-business-profiles");
        if (profilesStr) {
          try {
            const profiles = JSON.parse(profilesStr);
            const customMatch = profiles.find((p: any) =>
              p.ownerUsername === key ||
              `custom-${p.ownerUsername}` === key ||
              (p.businessName && p.businessName.toLowerCase().trim().replace(/\s+/g, "-") === key)
            );
            if (customMatch) {
              const generatedSlug = customMatch.businessName
                ? customMatch.businessName.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w\u0531-\u058F-]/g, "")
                : `custom-${customMatch.ownerUsername}`;
              list.push({
                id: `custom-${customMatch.ownerUsername}`,
                slug: generatedSlug,
                name: customMatch.businessName,
                city: customMatch.city || "Yerevan",
                category: { name: customMatch.category || "HoReCa" },
                ratingAvg: customMatch.ratingAvg || 5.0,
                images: customMatch.gallery || [],
                logoUrl: customMatch.logo || "",
                shortDescription: customMatch.shortDesc || ""
              });
              seen.add(key);
            }
          } catch (e) {}
        }
      }

      setSavedBusinesses(list);
    } catch (err) {
      console.error("Error loading favorites:", err);
    }
  };

  const loadUserBookings = () => {
    if (typeof window === "undefined") return;
    try {
      const localBookingsStr = localStorage.getItem("armbiz-local-bookings");
      const userBookingsStr = localStorage.getItem("armbiz_user_bookings");

      const allLocal: any[] = localBookingsStr ? JSON.parse(localBookingsStr) : [];
      const allUser: any[] = userBookingsStr ? JSON.parse(userBookingsStr) : [];

      const combined = [...allLocal, ...allUser];

      const uniqueMap = new Map<string, any>();
      for (const item of combined) {
        if (item && item.id) {
          uniqueMap.set(item.id, item);
        }
      }

      const uniqueList = Array.from(uniqueMap.values());

      const currentUsername = currentUser?.username?.toLowerCase() || "";
      const currentEmail = currentUser?.email?.toLowerCase() || "";
      const currentName = currentUser?.name?.toLowerCase() || "";
      const currentPhone = currentUser?.phone || "";

      // Filter ONLY bookings belonging to this current user!
      const filtered = uniqueList.filter((b: any) => {
        if (!b) return false;
        const bUserKey = (b.userKey || "").toLowerCase();
        const bCustomerName = (b.customerName || "").toLowerCase();
        const bPhone = b.customerPhone || "";
        const bEmail = (b.userEmail || b.customerEmail || "").toLowerCase();

        if (currentUsername && bUserKey === currentUsername) return true;
        if (currentEmail && (bUserKey === currentEmail || bEmail === currentEmail)) return true;
        if (currentName && (bUserKey === currentName || bCustomerName === currentName)) return true;
        if (currentPhone && bPhone && bPhone.includes(currentPhone)) return true;

        return false;
      });

      const mapped = filtered.map((b: any) => ({
        id: b.id,
        businessName: b.businessName || "Business Listing",
        businessSlug: b.businessSlug || "",
        service: b.service || b.serviceName || "General Service",
        date: b.date || b.bookingDate || "N/A",
        time: b.time || b.timeSlot || b.bookingTime || "N/A",
        status: b.status || "pending",
        notes: b.notes || b.bookingNotes || ""
      }));

      setUserBookings(mapped);
    } catch (err) {
      console.error("Error loading user bookings:", err);
      setUserBookings([]);
    }
  };

  const loadUserReviews = () => {
    if (typeof window === "undefined" || !currentUser) {
      setUserReviewsList([]);
      setUserReviewsCount(0);
      return;
    }

    try {
      const list: any[] = [];
      const currentName = currentUser?.name?.toLowerCase().trim() || "";
      const currentUsername = currentUser?.username?.toLowerCase().trim() || "";
      const currentEmail = currentUser?.email?.toLowerCase().trim() || "";

      // 1. Check armbiz_user_reviews (always user's own written reviews)
      const userReviewsStr = localStorage.getItem("armbiz_user_reviews");
      if (userReviewsStr) {
        try {
          const parsed = JSON.parse(userReviewsStr);
          if (Array.isArray(parsed)) {
            parsed.forEach((r) => {
              if (r && r._id && !list.some((existing) => existing._id === r._id)) {
                list.push(r);
              }
            });
          }
        } catch (e) {}
      }

      // 2. Scan all armbiz-reviews- keys in localStorage for user-added reviews
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("armbiz-reviews-")) {
          const slug = key.replace("armbiz-reviews-", "");
          const val = localStorage.getItem(key);
          if (val) {
            try {
              const reviewsArr: any[] = JSON.parse(val);
              if (Array.isArray(reviewsArr)) {
                reviewsArr.forEach((r) => {
                  if (!r || !r._id) return;

                  // Never include seeded mock reviews
                  if (r._id.startsWith("seed-")) return;

                  const rName = (r.authorName || r.userName || r.author?.name || r.name || "").toLowerCase().trim();
                  const rUsername = (r.userUsername || r.username || r.author?.username || "").toLowerCase().trim();
                  const rEmail = (r.userEmail || r.email || "").toLowerCase().trim();

                  const isUserAdded = r._id.startsWith("local-");
                  const matchesUser =
                    isUserAdded ||
                    (currentName && (rName === currentName || rName.includes(currentName) || currentName.includes(rName))) ||
                    (currentUsername && (rUsername === currentUsername || rName === currentUsername || rName.includes(currentUsername))) ||
                    (currentEmail && rEmail === currentEmail);

                  if (matchesUser && !list.some((existing) => existing._id === r._id)) {
                    list.push({
                      ...r,
                      businessSlug: slug,
                    });
                  }
                });
              }
            } catch (e) {}
          }
        }
      }

      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      setUserReviewsList(list);
      setUserReviewsCount(list.length);
    } catch (err) {
      console.error("Error loading user reviews:", err);
    }
  };

  const handleDeleteReview = (reviewId: string, slug?: string) => {
    try {
      if (slug) {
        const key = `armbiz-reviews-${slug}`;
        const val = localStorage.getItem(key);
        if (val) {
          const reviewsArr: any[] = JSON.parse(val);
          const updated = reviewsArr.filter((r) => r._id !== reviewId);
          localStorage.setItem(key, JSON.stringify(updated));
        }
      }
      const userReviewsStr = localStorage.getItem("armbiz_user_reviews");
      if (userReviewsStr) {
        const parsed: any[] = JSON.parse(userReviewsStr);
        const updated = parsed.filter((r) => r._id !== reviewId);
        localStorage.setItem("armbiz_user_reviews", JSON.stringify(updated));
      }
      window.dispatchEvent(new Event("reviewsUpdated"));
      loadUserReviews();
    } catch (e) {
      console.error("Error removing review:", e);
    }
  };

  // Load Saved Favorites, Bookings & Reviews from LocalStorage / Backend
  useEffect(() => {
    loadFavorites();
    loadUserBookings();
    loadUserReviews();

    const handleUpdate = () => {
      loadFavorites();
      loadUserBookings();
      loadUserReviews();
    };

    window.addEventListener("favoritesUpdated", handleUpdate);
    window.addEventListener("bookingsUpdated", handleUpdate);
    window.addEventListener("reviewsUpdated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("favoritesUpdated", handleUpdate);
      window.removeEventListener("bookingsUpdated", handleUpdate);
      window.removeEventListener("reviewsUpdated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [currentUser]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (token) {
        const cleanDigits = phone.replace(/\D/g, "");
        const fullPhone = cleanDigits ? `+374${cleanDigits}` : "";
        const res = await axios.put(
          `${getApiUrl()}/auth/profile`,
          { name, phone: fullPhone, bio, avatar, location },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data?.success) {
          setProfileMsg({
            type: "success",
            text: locale === "hy" ? "Պրոֆիլը հաջողությամբ թարմացվեց" : locale === "ru" ? "Профиль успешно обновлен" : "Profile updated successfully"
          });
          refreshUser();
        } else {
          setProfileMsg({
            type: "error",
            text: res.data?.message || (locale === "hy" ? "Սխալ տեղի ունեցավ" : "Update failed")
          });
        }
      } else {
        // Local state update
        if (typeof window !== "undefined") {
          try {
            const localUserStr = localStorage.getItem("user");
            if (localUserStr) {
              const u = JSON.parse(localUserStr);
              if (name) u.name = name;
              if (username) u.username = username;
              if (phone) u.phone = phone;
              if (avatar) u.avatar = avatar;
              localStorage.setItem("user", JSON.stringify(u));
              refreshUser?.();
            }
          } catch (err) {}
        }
        setProfileMsg({
          type: "success",
          text: locale === "hy" ? "Տվյալները պահպանվել են" : "Saved successfully"
        });
      }
    } catch (err: any) {
      setProfileMsg({
        type: "error",
        text: err.response?.data?.message || (locale === "hy" ? "Չհաջողվեց պահպանել փոփոխությունները" : "Failed to update profile")
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword !== confirmPassword) {
      setPasswordMsg({
        type: "error",
        text: locale === "hy" ? "Նոր գաղտնաբառերը չեն համապատասխանում" : "New passwords do not match"
      });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMsg({
        type: "error",
        text: locale === "hy" ? "Գաղտնաբառը պետք է լինի առնվազն 8 նիշ" : "Password must be at least 8 characters"
      });
      return;
    }

    setChangingPassword(true);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (token) {
        const res = await axios.put(
          `${getApiUrl()}/auth/change-password`,
          { currentPassword, newPassword },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data?.success) {
          setPasswordMsg({
            type: "success",
            text: locale === "hy" ? "Գաղտնաբառը հաջողությամբ փոխվեց" : "Password updated successfully"
          });
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        } else {
          setPasswordMsg({
            type: "error",
            text: res.data?.message || "Password change failed"
          });
        }
      } else {
        setPasswordMsg({
          type: "success",
          text: locale === "hy" ? "Գաղտնաբառը թարմացվեց" : "Password updated"
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err: any) {
      setPasswordMsg({
        type: "error",
        text: err.response?.data?.message || (locale === "hy" ? "Ընթացիկ գաղտնաբառը սխալ է" : "Incorrect current password")
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const removeFavorite = (id: string) => {
    if (typeof window === "undefined") return;
    try {
      const favStr = localStorage.getItem("armbiz_favorites");
      const itemsStr = localStorage.getItem("armbiz_favorites_items");

      let favIds: string[] = favStr ? JSON.parse(favStr) : [];
      let itemsMap: Record<string, any> = itemsStr ? JSON.parse(itemsStr) : {};

      favIds = favIds.filter((itemKey) => itemKey !== id);
      delete itemsMap[id];

      localStorage.setItem("armbiz_favorites", JSON.stringify(favIds));
      localStorage.setItem("armbiz_favorites_items", JSON.stringify(itemsMap));

      setSavedBusinesses((prev) => prev.filter((b) => b.id !== id && b.slug !== id));
      window.dispatchEvent(new Event("favoritesUpdated"));
    } catch (e) {}
  };

  const removeBooking = (id: string) => {
    if (typeof window === "undefined") return;
    try {
      const localBookingsStr = localStorage.getItem("armbiz-local-bookings");
      const userBookingsStr = localStorage.getItem("armbiz_user_bookings");

      let allLocal: any[] = localBookingsStr ? JSON.parse(localBookingsStr) : [];
      let allUser: any[] = userBookingsStr ? JSON.parse(userBookingsStr) : [];

      allLocal = allLocal.filter((b) => b && b.id !== id);
      allUser = allUser.filter((b) => b && b.id !== id);

      localStorage.setItem("armbiz-local-bookings", JSON.stringify(allLocal));
      localStorage.setItem("armbiz_user_bookings", JSON.stringify(allUser));

      setUserBookings((prev) => prev.filter((b) => b.id !== id));
      window.dispatchEvent(new Event("bookingsUpdated"));
    } catch (e) {
      console.error("Error removing booking:", e);
    }
  };

  const getAccountTier = () => {
    const count = userBookings.length;
    if (count >= 70) {
      return {
        label: locale === "hy" ? "Գոլդ Member" : locale === "ru" ? "Gold Member" : "Gold Member",
        colorClass: "text-amber-500 dark:text-amber-400 font-black",
        badgeBg: "bg-amber-500/15 text-amber-500 dark:bg-amber-400/20 dark:text-amber-400 border border-amber-500/20",
        icon: Sparkles
      };
    }
    if (count >= 40) {
      return {
        label: locale === "hy" ? "Սիլվեր Member" : locale === "ru" ? "Silver Member" : "Silver Member",
        colorClass: "text-slate-600 dark:text-slate-300 font-black",
        badgeBg: "bg-slate-400/15 text-slate-600 dark:bg-slate-300/20 dark:text-slate-300 border border-slate-400/20",
        icon: Shield
      };
    }
    if (count >= 20) {
      return {
        label: locale === "hy" ? "Բրոնզ Member" : locale === "ru" ? "Bronze Member" : "Bronze Member",
        colorClass: "text-amber-700 dark:text-amber-500 font-black",
        badgeBg: "bg-amber-700/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-500 border border-amber-700/20",
        icon: Award
      };
    }
    return {
      label: "Member",
      colorClass: "text-[hsl(var(--foreground))] font-black",
      badgeBg: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
      icon: Star
    };
  };

  const accountTier = getAccountTier();
  const TierIcon = accountTier.icon;

  const displayName = currentUser?.name || currentUser?.username || "User";
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Top Header Banner Card ── */}
        <div className="relative overflow-hidden rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-6 sm:p-8 shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 dark:from-primary/20 dark:via-primary/5 dark:to-primary/10 pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group cursor-pointer">
              {avatar ? (
                <img
                  src={avatar}
                  alt={displayName}
                  className="w-24 h-24 rounded-full object-cover border-4 border-[hsl(var(--card))] shadow-md transition-all group-hover:brightness-90"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-amber-500 flex items-center justify-center text-white text-3xl font-black shadow-md transition-all group-hover:brightness-90">
                  {userInitial}
                </div>
              )}

              {/* Camera Badge button */}
              <label className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-white border-2 border-[hsl(var(--card))] cursor-pointer hover:scale-110 transition-transform shadow-md">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const newImg = reader.result as string;
                        setAvatar(newImg);
                        if (typeof window !== "undefined") {
                          try {
                            const localUserStr = localStorage.getItem("user");
                            if (localUserStr) {
                              const u = JSON.parse(localUserStr);
                              u.avatar = newImg;
                              localStorage.setItem("user", JSON.stringify(u));
                              refreshUser?.();
                            }
                          } catch (err) {
                            console.error("Error saving avatar locally:", err);
                          }
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[hsl(var(--foreground))]">{displayName}</h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle className="w-3 h-3" />
                  {locale === "hy" ? "Անձնական Հաշիվ" : locale === "ru" ? "Личный аккаунт" : "Personal Account"}
                </span>
              </div>
              <p className="text-sm text-[hsl(var(--muted-foreground))] flex items-center justify-center sm:justify-start gap-3 flex-wrap">
                <span>@{currentUser?.username || "user"}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 opacity-70" /> {currentUser?.email}</span>
                {phone && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 opacity-70" /> +374 {phone}</span>
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/discover"
                className="h-10 px-4 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary/90 transition-all flex items-center gap-2 shadow-sm"
              >
                <Search className="w-3.5 h-3.5" />
                {locale === "hy" ? "Որոնել Ռեստորաններ" : "Explore Places"}
              </Link>
              <button
                onClick={logout}
                className="h-10 px-3.5 rounded-xl text-xs font-medium border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-colors flex items-center gap-1.5 text-red-600 dark:text-red-400"
              >
                <LogOut className="w-3.5 h-3.5" />
                {locale === "hy" ? "Դուրս գալ" : "Sign out"}
              </button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[hsl(var(--border))]">
            <div className="bg-[hsl(var(--background))] rounded-xl p-3 border border-[hsl(var(--border))] flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <Bookmark className="w-4 h-4 fill-amber-500 text-amber-500" />
              </div>
              <div>
                <div className="text-lg font-black text-[hsl(var(--foreground))]">{savedBusinesses.length}</div>
                <div className="text-[11px] text-[hsl(var(--muted-foreground))]">
                  {locale === "hy" ? "Նախընտրածներ" : "Saved Places"}
                </div>
              </div>
            </div>

            <div className="bg-[hsl(var(--background))] rounded-xl p-3 border border-[hsl(var(--border))] flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="text-lg font-black text-[hsl(var(--foreground))]">{userBookings.length}</div>
                <div className="text-[11px] text-[hsl(var(--muted-foreground))]">
                  {locale === "hy" ? "Ամրագրումներ" : "My Bookings"}
                </div>
              </div>
            </div>

            <div className="bg-[hsl(var(--background))] rounded-xl p-3 border border-[hsl(var(--border))] flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <div className="text-lg font-black text-[hsl(var(--foreground))]">{userReviewsCount}</div>
                <div className="text-[11px] text-[hsl(var(--muted-foreground))]">
                  {locale === "hy" ? "Մեկնաբանություններ" : locale === "ru" ? "Отзывы" : "Reviews"}
                </div>
              </div>
            </div>

            <div className="bg-[hsl(var(--background))] rounded-xl p-3 border border-[hsl(var(--border))] flex items-center gap-3">
              <div className={`p-2 rounded-lg ${accountTier.badgeBg}`}>
                <TierIcon className="w-4 h-4" />
              </div>
              <div>
                <div className={`text-lg ${accountTier.colorClass}`}>{accountTier.label}</div>
                <div className="text-[11px] text-[hsl(var(--muted-foreground))]">
                  {locale === "hy" ? "Կարգավիճակ" : "Account Status"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Navigation Tabs ── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar border-b border-[hsl(var(--border))]">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 border cursor-pointer ${
              activeTab === "profile"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-slate-900 dark:border-white shadow-md"
                : "bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            {locale === "hy" ? "Անձնական Տվյալներ" : locale === "ru" ? "Личные данные" : "Personal Profile"}
          </button>

          <button
            onClick={() => setActiveTab("favorites")}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 border cursor-pointer ${
              activeTab === "favorites"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-slate-900 dark:border-white shadow-md"
                : "bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            {locale === "hy" ? "Իմ Նախընտրածները" : locale === "ru" ? "Избранное" : "Saved Places"}
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-black transition-colors ${
              activeTab === "favorites"
                ? "bg-white text-slate-950 dark:bg-slate-950 dark:text-white shadow-sm"
                : "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] dark:bg-slate-800 dark:text-slate-200"
            }`}>
              {savedBusinesses.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("bookings")}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 border cursor-pointer ${
              activeTab === "bookings"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-slate-900 dark:border-white shadow-md"
                : "bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            {locale === "hy" ? "Իմ Ամրագրումները" : locale === "ru" ? "Мои бронирования" : "My Bookings"}
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-black transition-colors ${
              activeTab === "bookings"
                ? "bg-white text-slate-950 dark:bg-slate-950 dark:text-white shadow-sm"
                : "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] dark:bg-slate-800 dark:text-slate-200"
            }`}>
              {userBookings.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("reviews")}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 border cursor-pointer ${
              activeTab === "reviews"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-slate-900 dark:border-white shadow-md"
                : "bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            {locale === "hy" ? "Իմ Մեկնաբանությունները" : locale === "ru" ? "Мои отзывы" : "My Reviews"}
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-black transition-colors ${
              activeTab === "reviews"
                ? "bg-white text-slate-950 dark:bg-slate-950 dark:text-white shadow-sm"
                : "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] dark:bg-slate-800 dark:text-slate-200"
            }`}>
              {userReviewsCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 border cursor-pointer ${
              activeTab === "security"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-slate-900 dark:border-white shadow-md"
                : "bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            {locale === "hy" ? "Անվտանգություն" : locale === "ru" ? "Безопасность" : "Security & Password"}
          </button>
        </div>

        {/* ── TAB CONTENT: Profile Info ── */}
        {activeTab === "profile" && (
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-[hsl(var(--foreground))]">
                {locale === "hy" ? "Անձնական Տվյալների Խմբագրում" : "Edit Personal Details"}
              </h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                {locale === "hy" ? "Թարմացրեք ձեր անձնական տվյալները և կոնտակտային ինֆորմացիան" : "Update your profile information and contact options."}
              </p>
            </div>

            {profileMsg && (
              <div
                className={`p-4 rounded-xl text-sm border flex items-center gap-2 ${
                  profileMsg.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
                }`}
              >
                {profileMsg.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <ShieldCheck className="w-4 h-4 shrink-0" />}
                <span>{profileMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-[hsl(var(--foreground))]">{t.auth.name || "Full Name"}</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-[hsl(var(--foreground))]">{t.auth.username || "Username"}</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[hsl(var(--muted-foreground))]">@</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled
                      className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] pl-8 pr-4 py-2.5 text-sm outline-none cursor-not-allowed opacity-80"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-[hsl(var(--foreground))]">{t.auth.email || "Email Address"}</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled
                      className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] pl-10 pr-4 py-2.5 text-sm outline-none cursor-not-allowed opacity-80"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-[hsl(var(--foreground))]">
                    {locale === "hy" ? "Հեռախոսահամար" : "Phone Number"}
                  </label>
                  <div className="flex w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] overflow-hidden focus-within:border-primary transition-all">
                    <div className="px-3.5 py-2.5 bg-[hsl(var(--muted))]/60 border-r border-[hsl(var(--border))] flex items-center gap-1.5 text-xs font-bold text-[hsl(var(--foreground))] select-none shrink-0">
                      <Phone className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
                      <span>+374</span>
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={phone}
                      onChange={(e) => {
                        const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 8);
                        const formatted = digitsOnly.match(/.{1,2}/g)?.join(" ") || "";
                        setPhone(formatted);
                      }}
                      maxLength={11}
                      placeholder="99 12 34 56"
                      className="w-full bg-transparent text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] px-3.5 py-2.5 text-sm outline-none font-medium tracking-wider"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-[hsl(var(--foreground))]">{locale === "hy" ? "Քաղաք / Վայր" : "City / Location"}</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Yerevan, Armenia"
                    className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>



              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="h-11 px-6 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary/90 transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
                >
                  {savingProfile ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {locale === "hy" ? "Պահպանել փոփոխությունները" : "Save Profile"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── TAB CONTENT: Favorites ── */}
        {activeTab === "favorites" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-[hsl(var(--foreground))]">
                  {locale === "hy" ? "Իմ Նախընտրած Վայրերը" : "Saved Businesses"}
                </h2>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  {locale === "hy" ? "Ձեր պահպանած ռեստորաններն ու բիզնեսները" : "Quick access to your bookmarked places."}
                </p>
              </div>
              <Link href="/discover" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                {locale === "hy" ? "Ավելացնել նորը" : "Explore more"} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {savedBusinesses.length === 0 ? (
              <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-12 text-center space-y-3">
                <Bookmark className="w-12 h-12 text-amber-500 mx-auto opacity-40" />
                <h3 className="text-base font-bold text-[hsl(var(--foreground))]">{locale === "hy" ? "Դեռ չունեք նախընտրած վայրեր" : "No saved places yet"}</h3>
                <p className="text-xs text-[hsl(var(--muted-foreground))] max-w-sm mx-auto">
                  {locale === "hy" ? "Փնտրեք ռեստորաններ և սեղմեք պահպանելու կոճակը" : "Browse businesses and click the bookmark button to save your top favorites."}
                </p>
                <Link href="/discover" className="inline-flex h-10 px-5 rounded-xl bg-primary text-white text-xs font-bold items-center gap-2 mt-2">
                  <Search className="w-3.5 h-3.5" />
                  {locale === "hy" ? "Դիտել Ցանկը" : "Browse Directory"}
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedBusinesses.map((biz) => {
                  const img = biz.images?.[0] || biz.logoUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80";
                  return (
                    <div
                      key={biz.id || biz.slug}
                      className="group bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl overflow-hidden hover:shadow-lg transition-all flex flex-col"
                    >
                      <div className="relative h-40 overflow-hidden bg-[hsl(var(--muted))]">
                        <img
                          src={img}
                          alt={biz.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <button
                          onClick={() => removeFavorite(biz.id || biz.slug)}
                          className="absolute top-2.5 right-2.5 p-2 rounded-full bg-black/60 backdrop-blur text-white hover:bg-red-600 transition-colors shadow"
                          title="Remove from favorites"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        {biz.category && (
                          <span className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/70 backdrop-blur text-white">
                            {typeof biz.category === "object" ? biz.category.name : biz.category}
                          </span>
                        )}
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-bold text-sm text-[hsl(var(--foreground))] truncate">{biz.name}</h3>
                            {biz.ratingAvg && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-bold bg-amber-500/10 text-amber-500 shrink-0">
                                ★ {Number(biz.ratingAvg).toFixed(1)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">{biz.city || "Yerevan"}</span>
                          </p>
                        </div>

                        <Link
                          href={`/business/${biz.slug || biz.id}`}
                          className="w-full h-9 rounded-xl border border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          {locale === "hy" ? "Դիտել էջը" : "View Profile"}
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB CONTENT: Bookings ── */}
        {activeTab === "bookings" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-[hsl(var(--foreground))]">
                {locale === "hy" ? "Իմ Ամրագրումները" : "My Reservations"}
              </h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                {locale === "hy" ? "Ձեր կատարած վերապահումները Findy հարթակում" : "Track all your table bookings and reservations."}
              </p>
            </div>

            {userBookings.length === 0 ? (
              <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-12 text-center space-y-3">
                <Calendar className="w-12 h-12 text-[hsl(var(--muted-foreground))] mx-auto opacity-40" />
                <h3 className="text-base font-bold text-[hsl(var(--foreground))]">{locale === "hy" ? "Ամրագրումներ առայժմ չկան" : "No bookings found"}</h3>
                <p className="text-xs text-[hsl(var(--muted-foreground))] max-w-sm mx-auto">
                  {locale === "hy" ? "Ամրագրեք սեղաններ ձեր սիրելի ռեստորաններում" : "Book tables and reserve spots instantly."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {userBookings.map((b) => (
                  <div
                    key={b.id}
                    className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-base text-[hsl(var(--foreground))]">{b.businessName}</h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            b.status === "confirmed"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : b.status === "pending"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                              : "bg-gray-500/10 text-gray-500"
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-primary">{b.service}</p>
                      <div className="flex items-center gap-4 text-xs text-[hsl(var(--muted-foreground))] pt-1">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {b.date}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {b.time}</span>
                      </div>
                      {b.notes && <p className="text-xs text-[hsl(var(--muted-foreground))] italic mt-1">&quot;{b.notes}&quot;</p>}
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {b.businessSlug ? (
                        <Link
                          href={`/business/${b.businessSlug}`}
                          className="flex-1 sm:flex-initial h-9 px-4 rounded-xl border border-[hsl(var(--border))] text-[hsl(var(--foreground))] text-xs font-semibold hover:bg-[hsl(var(--muted))] flex items-center justify-center transition-colors"
                        >
                          {locale === "hy" ? "Մանրամասն" : "Details"}
                        </Link>
                      ) : (
                        <Link
                          href="/discover"
                          className="flex-1 sm:flex-initial h-9 px-4 rounded-xl border border-[hsl(var(--border))] text-[hsl(var(--foreground))] text-xs font-semibold hover:bg-[hsl(var(--muted))] flex items-center justify-center transition-colors"
                        >
                          {locale === "hy" ? "Մանրամասն" : "Details"}
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => removeBooking(b.id)}
                        className="h-9 px-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
                        title={locale === "hy" ? "Հեռացնել ամրագրումը" : "Remove reservation"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{locale === "hy" ? "Հեռացնել" : "Remove"}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB CONTENT: My Reviews ── */}
        {activeTab === "reviews" && (
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-[hsl(var(--foreground))]">
                  {locale === "hy" ? "Իմ Մեկնաբանությունները" : locale === "ru" ? "Мои отзывы" : "My Reviews"}
                </h2>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  {locale === "hy"
                    ? "Ձեր կողմից թողնված բոլոր կարծիքներն ու մեկնաբանությունները"
                    : locale === "ru"
                    ? "Все оставленные вами отзывы и комментарии"
                    : "All reviews and comments submitted by you."}
                </p>
              </div>
            </div>

            {userReviewsList.length === 0 ? (
              <div className="text-center py-12 space-y-3 bg-[hsl(var(--background))] rounded-xl border border-dashed border-[hsl(var(--border))] p-6">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[hsl(var(--foreground))]">
                  {locale === "hy" ? "Մեկնաբանություններ առայժմ չկան" : locale === "ru" ? "Отзывов пока нет" : "No reviews found"}
                </h3>
                <p className="text-xs text-[hsl(var(--muted-foreground))] max-w-sm mx-auto">
                  {locale === "hy"
                    ? "Այցելեք ռեստորանների և բիզնեսների էջերը՝ ձեր կարծիքն ու գնահատականը թողնելու համար:"
                    : "Explore places and share your honest feedback and rating."}
                </p>
                <Link
                  href="/discover"
                  className="inline-flex h-9 px-4 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary/90 transition-all items-center gap-1.5 shadow-sm mt-2"
                >
                  <Search className="w-3.5 h-3.5" />
                  {locale === "hy" ? "Որոնել Վայրեր" : "Explore Places"}
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {userReviewsList.map((rev, idx) => {
                  const bSlug = rev.businessSlug || "";
                  const mockMatch = MOCK_BUSINESSES.find((b) => b.slug === bSlug || b.id === bSlug);
                  const displayTitle = mockMatch
                    ? (locale === "hy" ? mockMatch.titleHy || mockMatch.title : mockMatch.titleRu || mockMatch.title)
                    : rev.businessName || bSlug || "Business";

                  const ratingVal = Math.min(5, Math.max(1, Number(rev.rating) || 5));
                  const imageList: string[] = rev.images && rev.images.length > 0 ? rev.images : (rev.image ? [rev.image] : []);

                  return (
                    <div
                      key={rev._id ? `${rev._id}-${idx}` : rev.id ? `${rev.id}-${idx}` : `user-rev-${idx}`}
                      className="p-5 rounded-2xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] space-y-3.5 transition-all hover:border-emerald-500/40 shadow-sm"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          {bSlug ? (
                            <Link
                              href={`/business/${bSlug}`}
                              className="font-bold text-sm text-primary hover:underline flex items-center gap-1.5"
                            >
                              <Building2 className="w-4 h-4 text-emerald-500 shrink-0" />
                              <span>{displayTitle}</span>
                            </Link>
                          ) : (
                            <span className="font-bold text-sm text-[hsl(var(--foreground))] flex items-center gap-1.5">
                              <Building2 className="w-4 h-4 text-emerald-500 shrink-0" />
                              <span>{displayTitle}</span>
                            </span>
                          )}
                          <span className="text-xs text-[hsl(var(--muted-foreground))]">•</span>
                          <span className="text-xs text-[hsl(var(--muted-foreground))]">
                            {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : "Recently"}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* 5-Star Rating Visual Bar */}
                          <div className="flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3.5 h-3.5 ${
                                    star <= ratingVal
                                      ? "fill-amber-400 text-amber-400"
                                      : "fill-transparent text-slate-300 dark:text-slate-600"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs font-black text-amber-600 dark:text-amber-400 ml-1">
                              {ratingVal}.0
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteReview(rev._id, bSlug)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors cursor-pointer"
                            title={locale === "hy" ? "Հեռացնել մեկնաբանությունը" : "Delete review"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Comment text */}
                      <p className="text-sm text-[hsl(var(--foreground))] leading-relaxed whitespace-pre-wrap font-normal">
                        {rev.comment || rev.text || rev.content}
                      </p>

                      {/* Attached Photos Gallery */}
                      {imageList.length > 0 && (
                        <div className="space-y-1.5 pt-1 border-t border-[hsl(var(--border))]">
                          <div className="text-[11px] font-bold text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
                            <Camera className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{locale === "hy" ? `Կցված լուսանկարներ (${imageList.length})` : `Attached Photos (${imageList.length})`}</span>
                          </div>
                          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 custom-scrollbar">
                            {imageList.map((img: string, idx: number) => (
                              <a
                                key={idx}
                                href={img}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative group shrink-0 rounded-xl overflow-hidden border border-[hsl(var(--border))] shadow-sm"
                              >
                                <img
                                  src={img}
                                  alt={`Attached photo ${idx + 1}`}
                                  className="w-20 h-20 sm:w-24 sm:h-24 object-cover transition-transform group-hover:scale-105"
                                />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB CONTENT: Security ── */}
        {activeTab === "security" && (
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-[hsl(var(--foreground))]">
                {locale === "hy" ? "Գաղտնաբառի Փոփոխում" : "Security & Password"}
              </h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                {locale === "hy" ? "Թարմացրեք ձեր մուտքի գաղտնաբառը հաշվի անվտանգության համար" : "Update your password to keep your personal account safe."}
              </p>
            </div>

            {passwordMsg && (
              <div
                className={`p-4 rounded-xl text-sm border flex items-center gap-2 ${
                  passwordMsg.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
                }`}
              >
                {passwordMsg.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <ShieldCheck className="w-4 h-4 shrink-0" />}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-[hsl(var(--foreground))]">{locale === "hy" ? "Ընթացիկ Գաղտնաբառ" : "Current Password"}</label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-[hsl(var(--foreground))]">{locale === "hy" ? "Նոր Գաղտնաբառ" : "New Password"}</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-[hsl(var(--foreground))]">{locale === "hy" ? "Կրկնել Նոր Գաղտնաբառը" : "Confirm New Password"}</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="h-11 px-6 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary/90 transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
                >
                  {changingPassword ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Key className="w-4 h-4" />
                  )}
                  {locale === "hy" ? "Փոխել Գաղտնաբառը" : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── TAB CONTENT: Business Upgrade CTA ── */}
        {activeTab === "business" && (
          <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-slate-900/5 dark:from-slate-900 dark:via-slate-800 dark:to-slate-950 text-slate-900 dark:text-white rounded-2xl p-8 border border-amber-500/20 dark:border-slate-700/60 shadow-xl shadow-amber-500/5 dark:shadow-slate-950/50 space-y-6 transition-colors duration-200">
            <div className="max-w-xl space-y-3">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-400 text-slate-950 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                {locale === "hy" ? "Բիզնես Սեփականատերերի համար" : "For Business Owners"}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {locale === "hy" ? "Գրանցեք Ձեր Բիզնեսը Findy-ում" : "Grow Your Business with Findy"}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {locale === "hy"
                  ? "Ներկայացրեք ձեր ռեստորանը, սրճարանը կամ ծառայությունները հազարավոր այցելուների: Կառավարեք վերապահումները, հրապարակեք մենյուներ և սթորիներ:"
                  : "List your restaurant, cafe, or business on Findy. Manage online reservations, publish menus, stories and reach thousands of customers."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-white/80 dark:bg-white/5 border border-amber-500/15 dark:border-white/10 rounded-xl p-4 space-y-1 shadow-sm dark:shadow-none backdrop-blur-sm transition-colors duration-200">
                <Building2 className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{locale === "hy" ? "Օնլայն Պրոֆիլ" : "Online Profile"}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">{locale === "hy" ? "Լուսանկարներ, մենյու, աշխատանքային ժամեր" : "Photos, menus, contact info"}</p>
              </div>

              <div className="bg-white/80 dark:bg-white/5 border border-amber-500/15 dark:border-white/10 rounded-xl p-4 space-y-1 shadow-sm dark:shadow-none backdrop-blur-sm transition-colors duration-200">
                <Calendar className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{locale === "hy" ? "Սեղանների Ամրագրում" : "Table Reservations"}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">{locale === "hy" ? "Ընդունեք ամրագրումներ օնլայն" : "Accept online booking requests"}</p>
              </div>

              <div className="bg-white/80 dark:bg-white/5 border border-amber-500/15 dark:border-white/10 rounded-xl p-4 space-y-1 shadow-sm dark:shadow-none backdrop-blur-sm transition-colors duration-200">
                <Star className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{locale === "hy" ? "Բարձրացրեք Վարկանիշը" : "Boost Rating"}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">{locale === "hy" ? "Հավաքեք հաճախորդների կարծիքներ" : "Collect customer reviews"}</p>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/register"
                className="inline-flex h-11 px-6 rounded-xl text-xs font-extrabold bg-amber-400 hover:bg-amber-300 text-slate-950 items-center gap-2 transition-all shadow-lg hover:scale-105 active:scale-95"
              >
                <Building2 className="w-4 h-4" />
                {locale === "hy" ? "Գրանցել Բիզնես Հաշիվ" : "Register Business Account"}
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
