"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  Bookmark,
  Coins,
  Send,
  UserPlus,
  Gift,
  ShoppingBag,
  CheckCircle2,
  Ticket,
  QrCode,
  X,
  Check,
  Copy
} from "lucide-react";
import { MOCK_BUSINESSES } from "@/data/mock-businesses";

export default function UserProfileDashboard() {
  const { currentUser, logout, refreshUser } = useAuth();
  const { t, locale } = useI18n();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<"profile" | "favorites" | "bookings" | "reviews" | "security" | "transfer" | "invite" | "offers" | "business">("profile");

  useEffect(() => {
    if (!searchParams) return;
    const tabParam = searchParams.get("tab");
    if (tabParam && ["profile", "favorites", "bookings", "reviews", "security", "transfer", "invite", "offers", "business"].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

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

  // Favorites, Bookings, Reviews & Claimed Offers States
  const [savedBusinesses, setSavedBusinesses] = useState<any[]>([]);
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [userReviewsCount, setUserReviewsCount] = useState<number>(0);
  const [userReviewsList, setUserReviewsList] = useState<any[]>([]);
  const [claimedOffers, setClaimedOffers] = useState<any[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  const [copiedCouponCode, setCopiedCouponCode] = useState<string | null>(null);
  const [copiedInviteCode, setCopiedInviteCode] = useState(false);

  const handleCopyInviteCode = (code: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedInviteCode(true);
    setTimeout(() => setCopiedInviteCode(false), 2000);
  };

  const handleCopyCouponCode = (code: string) => {
    if (!code) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code);
      } else {
        const tempInput = document.createElement("input");
        tempInput.value = code;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand("copy");
        document.body.removeChild(tempInput);
      }
      setCopiedCouponCode(code);
      setTimeout(() => setCopiedCouponCode(null), 2000);
    } catch (e) {
      console.error("Failed to copy code:", e);
    }
  };

  const [inputInviteCode, setInputInviteCode] = useState("");
  const [appliedInviteCode, setAppliedInviteCode] = useState("");
  const [inviteCodeMsg, setInviteCodeMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (currentUser) {
      const uKey = currentUser.username || currentUser.email || "";
      const savedCode = (currentUser as any).redeemedInviteCode || (uKey ? localStorage.getItem(`armbiz_redeemed_code_${uKey}`) : null);
      if (savedCode) {
        setAppliedInviteCode(savedCode);
      }
    }
  }, [currentUser]);

  const handleApplyInviteCode = () => {
    if (!currentUser) return;
    const code = inputInviteCode.trim();
    if (!code) {
      setInviteCodeMsg({
        type: "error",
        text: locale === "hy" ? "Խնդրում ենք մուտքագրել հրավերի կոդ" : "Please enter an invite code"
      });
      return;
    }

    if (code.toLowerCase() === (currentUser.username || "").toLowerCase()) {
      setInviteCodeMsg({
        type: "error",
        text: locale === "hy" ? "Դուք չեք կարող մուտքագրել Ձեր սեփական կոդը" : "You cannot enter your own invite code"
      });
      return;
    }

    const uKey = currentUser.username || currentUser.email || (currentUser as any).id || "";
    try {
      const existingCoinsStr = uKey ? localStorage.getItem(`armbiz_user_coins_${uKey}`) : null;
      let currentCoins = existingCoinsStr !== null && !isNaN(Number(existingCoinsStr))
        ? Number(existingCoinsStr)
        : ((currentUser as any).findyCoins || 0);

      const newCoins = currentCoins + 100;

      if (uKey) {
        localStorage.setItem(`armbiz_user_coins_${uKey}`, String(newCoins));
        localStorage.setItem(`armbiz_redeemed_code_${uKey}`, code);
      }

      const usersStr = localStorage.getItem("armbiz_users");
      if (usersStr) {
        try {
          const users: any[] = JSON.parse(usersStr);
          const idx = users.findIndex((u) => u.username === currentUser.username || u.email === currentUser.email);
          if (idx !== -1) {
            users[idx].findyCoins = newCoins;
            users[idx].redeemedInviteCode = code;
            localStorage.setItem("armbiz_users", JSON.stringify(users));
          }
        } catch (e) { }
      }
      const updatedUser = { ...currentUser, findyCoins: newCoins, redeemedInviteCode: code };
      localStorage.setItem("armbiz_current_user", JSON.stringify(updatedUser));
      (currentUser as any).findyCoins = newCoins;
      (currentUser as any).redeemedInviteCode = code;

      setAppliedInviteCode(code);
      setInviteCodeMsg({
        type: "success",
        text: locale === "hy" ? "Հրավերի կոդը ակտիվացվեց! +100 FindyCoins ավելացվեց:" : "Invite code activated! +100 FindyCoins added!"
      });
      window.dispatchEvent(new Event("userUpdated"));
      window.dispatchEvent(new Event("coinsUpdated"));
    } catch (e) {
      setInviteCodeMsg({
        type: "error",
        text: locale === "hy" ? "Սխալ տեղի ունեցավ: Խնդրում ենք փորձել նորից:" : "An error occurred. Please try again."
      });
    }
  };

  const [selectedFriendUsername, setSelectedFriendUsername] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferMsg, setTransferMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  interface TransferRecord {
    id: string;
    recipientUsername: string;
    recipientDisplayName: string;
    amount: number;
    dateStr: string;
    timeStr: string;
    createdAt: string;
  }

  const [transferHistory, setTransferHistory] = useState<TransferRecord[]>([]);

  const loadTransferHistory = useCallback(() => {
    if (typeof window === "undefined" || !currentUser) {
      setTransferHistory([]);
      return;
    }
    try {
      const uKey = currentUser.username || currentUser.email || "";
      const keyName = uKey ? `armbiz_user_transfers_${uKey}` : "armbiz_user_transfers";
      const str = localStorage.getItem(keyName);
      if (str) {
        setTransferHistory(JSON.parse(str));
      } else {
        setTransferHistory([]);
      }
    } catch (e) {
      setTransferHistory([]);
    }
  }, [currentUser]);

  useEffect(() => {
    loadTransferHistory();
  }, [loadTransferHistory]);

  const [cooldownRemainingSec, setCooldownRemainingSec] = useState<number>(0);

  const formatCountdown = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  useEffect(() => {
    if (!currentUser || typeof window === "undefined") return;
    const uKey = currentUser.username || currentUser.email || (currentUser as any).id || "";
    if (!uKey) return;

    const checkCooldown = () => {
      const lastTs = localStorage.getItem(`armbiz_user_last_transfer_${uKey}`);
      if (lastTs) {
        const lastTime = Number(lastTs);
        const cooldownEndTime = lastTime + 24 * 60 * 60 * 1000;
        const diffSec = Math.max(0, Math.floor((cooldownEndTime - Date.now()) / 1000));
        setCooldownRemainingSec(diffSec);
      } else {
        setCooldownRemainingSec(0);
      }
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const invitedFriends = useMemo(() => {
    if (!currentUser) return [];
    const myUserKey = (currentUser.username || "").toLowerCase().trim();
    const myEmail = (currentUser.email || "").toLowerCase().trim();
    const myName = ((currentUser as any).displayName || currentUser.name || "").toLowerCase().trim();

    const friendsMap = new Map<string, { username: string; displayName: string }>();

    if (typeof window === "undefined" || typeof localStorage === "undefined") return [];

    // 1. Scan localStorage for armbiz_redeemed_code_* keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("armbiz_redeemed_code_")) {
        const friendKey = key.replace("armbiz_redeemed_code_", "").trim();
        const codeVal = (localStorage.getItem(key) || "").toLowerCase().trim();

        if (
          friendKey &&
          friendKey.toLowerCase() !== myUserKey &&
          friendKey.toLowerCase() !== myEmail &&
          (codeVal === myUserKey || codeVal === myEmail || (myName && codeVal === myName))
        ) {
          friendsMap.set(friendKey, {
            username: friendKey,
            displayName: friendKey.charAt(0).toUpperCase() + friendKey.slice(1),
          });
        }
      }
    }

    // 2. Scan armbiz_users array
    const usersStr = localStorage.getItem("armbiz_users");
    if (usersStr) {
      try {
        const allUsers: any[] = JSON.parse(usersStr);
        allUsers.forEach((u) => {
          if (!u) return;
          const uName = (u.username || "").toLowerCase().trim();
          const uEmail = (u.email || "").toLowerCase().trim();
          if ((uName && uName === myUserKey) || (uEmail && uEmail === myEmail)) return;

          const redeemed = (u.redeemedInviteCode || u.inviteCode || "").toLowerCase().trim();
          if (
            redeemed &&
            (redeemed === myUserKey || redeemed === myEmail || (myName && redeemed === myName))
          ) {
            const friendUsername = u.username || u.email || "user";
            friendsMap.set(friendUsername, {
              username: friendUsername,
              displayName: u.displayName || u.name || friendUsername,
            });
          }
        });
      } catch (e) { }
    }

    return Array.from(friendsMap.values());
  }, [currentUser]);

  const handleTransferCoins = () => {
    if (!currentUser) return;
    setTransferMsg(null);

    const uKey = currentUser.username || currentUser.email || (currentUser as any).id || "";

    // 1. Check 24-hour daily cooldown
    if (cooldownRemainingSec > 0) {
      setTransferMsg({
        type: "error",
        text: locale === "hy"
          ? `Փոխանցումը սահմանափակված է: Հաջորդ փոխանցումը հնարավոր կլինի ${formatCountdown(cooldownRemainingSec)} հետո:`
          : `Daily limit reached. Next transfer available in ${formatCountdown(cooldownRemainingSec)}.`
      });
      return;
    }

    const amount = Number(transferAmount);
    if (!selectedFriendUsername) {
      setTransferMsg({
        type: "error",
        text: locale === "hy" ? "Խնդրում ենք ընտրել հրավիրված ընկերոջը" : "Please select an invited friend"
      });
      return;
    }
    if (!amount || isNaN(amount) || amount <= 0) {
      setTransferMsg({
        type: "error",
        text: locale === "hy" ? "Խնդրում ենք մուտքագրել ճիշտ քանակ" : "Please enter a valid amount"
      });
      return;
    }

    // 2. Check 200 Coins max limit
    if (amount > 200) {
      setTransferMsg({
        type: "error",
        text: locale === "hy"
          ? "Օրական առավելագույն փոխանցման չափը 200 FindyCoins է:"
          : "Maximum transfer amount is 200 FindyCoins per day."
      });
      return;
    }

    const savedCoinsStr = uKey ? localStorage.getItem(`armbiz_user_coins_${uKey}`) : null;
    const currentCoins = savedCoinsStr !== null && !isNaN(Number(savedCoinsStr))
      ? Number(savedCoinsStr)
      : ((currentUser as any).findyCoins || 0);

    if (amount > currentCoins) {
      setTransferMsg({
        type: "error",
        text: locale === "hy" ? "Դուք չունեք բավարար Findy Coins փոխանցելու համար" : "You don't have enough Findy Coins"
      });
      return;
    }

    try {
      const newSenderCoins = currentCoins - amount;
      if (uKey) localStorage.setItem(`armbiz_user_coins_${uKey}`, String(newSenderCoins));
      (currentUser as any).findyCoins = newSenderCoins;

      const recipientCoinsStr = localStorage.getItem(`armbiz_user_coins_${selectedFriendUsername}`);
      const recipientCurrentCoins = recipientCoinsStr !== null && !isNaN(Number(recipientCoinsStr))
        ? Number(recipientCoinsStr)
        : 0;
      const newRecipientCoins = recipientCurrentCoins + amount;
      localStorage.setItem(`armbiz_user_coins_${selectedFriendUsername}`, String(newRecipientCoins));

      const usersStr = localStorage.getItem("armbiz_users");
      if (usersStr) {
        try {
          const users: any[] = JSON.parse(usersStr);
          const senderIdx = users.findIndex((u) => u.username === currentUser.username || u.email === currentUser.email);
          if (senderIdx !== -1) users[senderIdx].findyCoins = newSenderCoins;
          const recipientIdx = users.findIndex((u) => u.username === selectedFriendUsername);
          if (recipientIdx !== -1) users[recipientIdx].findyCoins = newRecipientCoins;
          localStorage.setItem("armbiz_users", JSON.stringify(users));
        } catch (e) { }
      }

      const recipientFriend = invitedFriends.find((f: any) => f.username === selectedFriendUsername);
      const now = new Date();
      const newRecord: TransferRecord = {
        id: "tr_" + Date.now(),
        recipientUsername: selectedFriendUsername,
        recipientDisplayName: recipientFriend?.displayName || selectedFriendUsername,
        amount: amount,
        dateStr: now.toLocaleDateString(locale === "hy" ? "hy-AM" : "en-US", { day: "2-digit", month: "long", year: "numeric" }),
        timeStr: now.toLocaleTimeString(locale === "hy" ? "hy-AM" : "en-US", { hour: "2-digit", minute: "2-digit" }),
        createdAt: now.toISOString(),
      };

      const updatedHistory = [newRecord, ...transferHistory];
      setTransferHistory(updatedHistory);
      if (uKey) {
        localStorage.setItem(`armbiz_user_transfers_${uKey}`, JSON.stringify(updatedHistory));
      }

      const nowMs = Date.now();
      if (uKey) {
        localStorage.setItem(`armbiz_user_last_transfer_${uKey}`, String(nowMs));
      }
      setCooldownRemainingSec(24 * 60 * 60);

      setTransferAmount("");
      setTransferMsg({
        type: "success",
        text: locale === "hy" ? `${amount} FindyCoins հաջողությամբ փոխանցվեց ${selectedFriendUsername}-ին:` : `${amount} FindyCoins successfully transferred to ${selectedFriendUsername}!`
      });

      window.dispatchEvent(new Event("userUpdated"));
      window.dispatchEvent(new Event("coinsUpdated"));
    } catch (e) {
      setTransferMsg({
        type: "error",
        text: locale === "hy" ? "Փոխանցման սխալ տեղի ունեցավ" : "Transfer failed"
      });
    }
  };

  const loadClaimedOffers = () => {
    if (typeof window === "undefined" || !currentUser) {
      setClaimedOffers([]);
      return;
    }
    try {
      const uKey = currentUser.username || currentUser.email || "";
      const keyName = uKey ? `armbiz_user_claimed_offers_${uKey}` : "armbiz_user_claimed_offers";
      const str = localStorage.getItem(keyName);
      if (str) {
        const all: any[] = JSON.parse(str);
        const now = Date.now();
        // Auto-remove offers whose 1-month window has passed
        const active = all.filter((item) => {
          if (!item.expiresAt) {
            // Legacy items without expiresAt: treat claimedAt + 30 days
            if (!item.claimedAt) return true;
            return now < new Date(item.claimedAt).getTime() + 30 * 24 * 60 * 60 * 1000;
          }
          return now < new Date(item.expiresAt).getTime();
        });
        if (active.length !== all.length) {
          localStorage.setItem(keyName, JSON.stringify(active));
        }
        setClaimedOffers(active);
      } else {
        setClaimedOffers([]);
      }
    } catch (e) {
      setClaimedOffers([]);
    }
  };

  const handleRedeemCoupon = (couponCode: string, itemObj?: any) => {
    if (typeof window === "undefined") return;
    try {
      const str = localStorage.getItem("armbiz_user_claimed_offers");
      if (str) {
        const list: any[] = JSON.parse(str);
        const updated = list.filter((item) => item.couponCode !== couponCode && item._id !== itemObj?._id && item._id !== selectedCoupon?._id);
        localStorage.setItem("armbiz_user_claimed_offers", JSON.stringify(updated));
        setClaimedOffers(updated);
        window.dispatchEvent(new Event("claimedOffersUpdated"));
      }
      setSelectedCoupon(null);
      alert(locale === "hy" ? `✓ Կուպոնը (${couponCode}) հաջողությամբ ստուգվեց և հանվեց ցանկից:` : `✓ Coupon (${couponCode}) successfully scanned and redeemed!`);
    } catch (e) {
      console.error("Error redeeming coupon:", e);
    }
  };

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

  const resolveBusinessLogo = (item: any): string => {
    if (!item) return "";
    const direct =
      item.logoUrl ||
      item.logo ||
      (Array.isArray(item.images) ? item.images[0] : typeof item.images === "string" ? item.images : "") ||
      (Array.isArray(item.gallery) ? item.gallery[0] : typeof item.gallery === "string" ? item.gallery : "") ||
      item.coverImageUrl ||
      item.coverUrl ||
      (Array.isArray(item.metadata?.coverUrl) ? item.metadata.coverUrl[0] : item.metadata?.coverUrl) ||
      item.image ||
      item.avatar ||
      "";
    if (direct && typeof direct === "string" && direct.trim().length > 0) {
      return direct.trim();
    }

    const itemKey = item.id || item.slug || "";
    const itemName = (item.name || item.businessName || "").toLowerCase().trim();

    const mockMatch = MOCK_BUSINESSES.find(
      (b) =>
        (itemKey && (b.id === itemKey || b.slug === itemKey)) ||
        (itemName && b.name && b.name.toLowerCase().trim() === itemName)
    );
    if (mockMatch) {
      const mockLogo =
        mockMatch.logo ||
        mockMatch.logoUrl ||
        (Array.isArray(mockMatch.images) ? mockMatch.images[0] : "") ||
        mockMatch.coverImageUrl ||
        "";
      if (mockLogo) return mockLogo;
    }

    if (typeof localStorage !== "undefined") {
      const profilesStr = localStorage.getItem("armbiz-business-profiles");
      if (profilesStr) {
        try {
          const profiles: any[] = JSON.parse(profilesStr);
          const found = profiles.find((p: any) => {
            if (!p) return false;
            const pName = (p.businessName || p.name || "").toLowerCase().trim();
            const pSlug = pName.replace(/\s+/g, "-").replace(/[^\w\u0531-\u058F-]/g, "");
            return (
              (itemKey && (p.id === itemKey || p.slug === itemKey || p.ownerUsername === itemKey || `custom-${p.ownerUsername}` === itemKey || pSlug === itemKey)) ||
              (itemName && pName && pName === itemName)
            );
          });
          if (found) {
            const profileLogo =
              found.logo ||
              found.logoUrl ||
              (Array.isArray(found.images) ? found.images[0] : "") ||
              (Array.isArray(found.gallery) ? found.gallery[0] : "") ||
              found.coverUrl ||
              found.coverImageUrl ||
              (Array.isArray(found.metadata?.coverUrl) ? found.metadata.coverUrl[0] : found.metadata?.coverUrl) ||
              found.image ||
              found.avatar ||
              "";
            if (profileLogo) return profileLogo;
          }
        } catch (e) { }
      }
    }
    return "";
  };

  const loadFavorites = () => {
    if (typeof window === "undefined" || !currentUser) {
      setSavedBusinesses([]);
      return;
    }
    try {
      const uKey = currentUser.username || currentUser.email || (currentUser as any).id || (currentUser as any)._id || "";
      const favStr = uKey ? localStorage.getItem(`armbiz_favorites_${uKey}`) : null;
      const itemsStr = uKey ? localStorage.getItem(`armbiz_favorites_items_${uKey}`) : null;

      const favIds: string[] = favStr ? JSON.parse(favStr) : [];
      const itemsMap: Record<string, any> = itemsStr ? JSON.parse(itemsStr) : {};

      if (favIds.length === 0 && Object.keys(itemsMap).length === 0) {
        setSavedBusinesses([]);
        return;
      }

      const list: any[] = [];
      const seen = new Set<string>();

      // 1. Process items from itemsMap
      Object.entries(itemsMap).forEach(([k, item]) => {
        if (!item) return;
        const itemKey = item.id || item.slug || k;
        if (!seen.has(itemKey)) {
          const logo = resolveBusinessLogo(item);
          list.push({ ...item, logoUrl: logo, logo: logo });
          seen.add(itemKey);
          if (item.id) seen.add(String(item.id));
          if (item.slug) seen.add(String(item.slug));
        }
      });

      // 2. Process items from favIds
      for (const key of favIds) {
        if (seen.has(key)) continue;

        // Check MOCK_BUSINESSES
        const mockMatch = MOCK_BUSINESSES.find(b => b.id === key || b.slug === key);
        if (mockMatch) {
          list.push(mockMatch);
          seen.add(key);
          if (mockMatch.id) seen.add(String(mockMatch.id));
          if (mockMatch.slug) seen.add(String(mockMatch.slug));
          continue;
        }

        // Check custom local profiles
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
              continue;
            }
          } catch (e) { }
        }
      }

      setSavedBusinesses(list);
    } catch (err) {
      console.error("Error loading favorites:", err);
    }
  };

  const loadUserBookings = () => {
    if (typeof window === "undefined" || !currentUser) {
      setUserBookings([]);
      return;
    }
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

      // Filter ONLY bookings belonging to this current user!
      const filtered = uniqueList.filter((b: any) => {
        if (!b) return false;
        const bUserKey = (b.userKey || "").toLowerCase();
        const bEmail = (b.userEmail || b.customerEmail || "").toLowerCase();

        if (currentUsername && bUserKey === currentUsername) return true;
        if (currentEmail && (bUserKey === currentEmail || bEmail === currentEmail)) return true;

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
        notes: b.notes || b.bookingNotes || "",
        totalPrice: b.totalPrice || b.price || 0
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
                const rUsername = (r.userUsername || r.username || r.author?.username || "").toLowerCase().trim();
                const rEmail = (r.userEmail || r.email || "").toLowerCase().trim();
                if ((currentUsername && rUsername === currentUsername) || (currentEmail && rEmail === currentEmail)) {
                  list.push(r);
                }
              }
            });
          }
        } catch (e) { }
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

                  const matchesUser =
                    (currentUsername && (rUsername === currentUsername || rName === currentUsername)) ||
                    (currentEmail && rEmail === currentEmail);

                  if (matchesUser && !list.some((existing) => existing._id === r._id)) {
                    list.push({
                      ...r,
                      businessSlug: slug,
                    });
                  }
                });
              }
            } catch (e) { }
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

  // Load Saved Favorites, Bookings, Reviews & Claimed Offers from LocalStorage / Backend
  useEffect(() => {
    loadFavorites();
    loadUserBookings();
    loadUserReviews();
    loadClaimedOffers();

    const handleUpdate = () => {
      loadFavorites();
      loadUserBookings();
      loadUserReviews();
      loadClaimedOffers();
    };

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "favorites" || tabParam === "saved") {
        setActiveTab("favorites");
      }
    }

    window.addEventListener("favoritesUpdated", handleUpdate);
    window.addEventListener("bookingsUpdated", handleUpdate);
    window.addEventListener("reviewsUpdated", handleUpdate);
    window.addEventListener("claimedOffersUpdated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("favoritesUpdated", handleUpdate);
      window.removeEventListener("bookingsUpdated", handleUpdate);
      window.removeEventListener("reviewsUpdated", handleUpdate);
      window.removeEventListener("claimedOffersUpdated", handleUpdate);
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
          } catch (err) { }
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

  const removeFavorite = (id: string, bizObj?: any) => {
    if (typeof window === "undefined" || !currentUser) return;
    try {
      const uKey = currentUser.username || currentUser.email || (currentUser as any).id || (currentUser as any)._id || "";
      if (!uKey) return;
      const userFavsKey = `armbiz_favorites_${uKey}`;
      const userItemsKey = `armbiz_favorites_items_${uKey}`;

      const favStr = localStorage.getItem(userFavsKey);
      const itemsStr = localStorage.getItem(userItemsKey);

      let favIds: string[] = favStr ? JSON.parse(favStr) : [];
      let itemsMap: Record<string, any> = itemsStr ? JSON.parse(itemsStr) : {};

      const keysToPurge = new Set<string>();
      if (id) keysToPurge.add(id);
      if (bizObj?.id) keysToPurge.add(String(bizObj.id));
      if (bizObj?.slug) keysToPurge.add(String(bizObj.slug));
      if (bizObj?.name) {
        const nameSlug = String(bizObj.name).toLowerCase().trim().replace(/\s+/g, "-");
        keysToPurge.add(nameSlug);
      }

      favIds = favIds.filter((itemKey) => {
        if (keysToPurge.has(itemKey)) return false;
        const matchInMap = itemsMap[itemKey];
        if (matchInMap && (keysToPurge.has(matchInMap.id) || keysToPurge.has(matchInMap.slug))) return false;
        return true;
      });

      keysToPurge.forEach((k) => delete itemsMap[k]);
      Object.keys(itemsMap).forEach((k) => {
        const item = itemsMap[k];
        if (item && (keysToPurge.has(item.id) || keysToPurge.has(item.slug))) {
          delete itemsMap[k];
        }
      });

      const safeSet = (key: string, val: string) => {
        try { localStorage.setItem(key, val); } catch (e) { }
      };

      safeSet(userFavsKey, JSON.stringify(favIds));
      safeSet(userItemsKey, JSON.stringify(itemsMap));

      setSavedBusinesses((prev) => prev.filter((b) => !keysToPurge.has(b.id) && !keysToPurge.has(b.slug)));
      window.dispatchEvent(new Event("favoritesUpdated"));
    } catch (e) { }
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

  // Calculate Findy Coins (from user-specific storage key or DB profile or 1% of total bookings value fallback)
  const uKeyForCoins = currentUser?.username || currentUser?.email || (currentUser as any)?.id || "";
  const savedCoinsStr = uKeyForCoins && typeof localStorage !== "undefined" ? localStorage.getItem(`armbiz_user_coins_${uKeyForCoins}`) : null;
  const findyCoins = savedCoinsStr !== null && !isNaN(Number(savedCoinsStr))
    ? Number(savedCoinsStr)
    : (currentUser?.findyCoins !== undefined ? currentUser.findyCoins : Math.floor(userBookings.reduce((sum, b) => sum + ((Number(b.totalPrice) || 0) * 0.01), 0)));

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
                <h3 className="text-2xl font-black text-[hsl(var(--foreground))] tracking-tight flex items-center ml-2">
                  {findyCoins.toLocaleString()} <span className="text-emerald-500 text-sm font-bold uppercase tracking-wider ml-1">Coins</span>
                </h3>
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
                onClick={() => setActiveTab("security")}
                className={`h-10 px-4 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 border cursor-pointer ${activeTab === "security"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-slate-900 dark:border-white shadow-md"
                  : "bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                  }`}
              >
                <Lock className="w-3.5 h-3.5" />
                {locale === "hy" ? "Անվտանգություն" : locale === "ru" ? "Безопасность" : "Security & Password"}
              </button>
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
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 border cursor-pointer ${activeTab === "profile"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-slate-900 dark:border-white shadow-md"
              : "bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
              }`}
          >
            <User className="w-3.5 h-3.5" />
            {locale === "hy" ? "Անձնական Տվյալներ" : locale === "ru" ? "Личные данные" : "Personal Profile"}
          </button>

          <button
            onClick={() => setActiveTab("favorites")}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 border cursor-pointer ${activeTab === "favorites"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-slate-900 dark:border-white shadow-md"
              : "bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
              }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            {locale === "hy" ? "Իմ Նախընտրածները" : locale === "ru" ? "Избранное" : "Saved Places"}
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-black transition-colors ${activeTab === "favorites"
              ? "bg-white text-slate-950 dark:bg-slate-950 dark:text-white shadow-sm"
              : "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] dark:bg-slate-800 dark:text-slate-200"
              }`}>
              {savedBusinesses.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("bookings")}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 border cursor-pointer ${activeTab === "bookings"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-slate-900 dark:border-white shadow-md"
              : "bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
              }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            {locale === "hy" ? "Իմ Ամրագրումները" : locale === "ru" ? "Мои бронирования" : "My Bookings"}
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-black transition-colors ${activeTab === "bookings"
              ? "bg-white text-slate-950 dark:bg-slate-950 dark:text-white shadow-sm"
              : "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] dark:bg-slate-800 dark:text-slate-200"
              }`}>
              {userBookings.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("reviews")}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 border cursor-pointer ${activeTab === "reviews"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-slate-900 dark:border-white shadow-md"
              : "bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
              }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            {locale === "hy" ? "Իմ Մեկնաբանությունները" : locale === "ru" ? "Мои отзывы" : "My Reviews"}
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-black transition-colors ${activeTab === "reviews"
              ? "bg-white text-slate-950 dark:bg-slate-950 dark:text-white shadow-sm"
              : "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] dark:bg-slate-800 dark:text-slate-200"
              }`}>
              {userReviewsCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("offers")}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 border cursor-pointer ${activeTab === "offers"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-slate-900 dark:border-white shadow-md"
              : "bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
              }`}
          >
            <Gift className="w-3.5 h-3.5 text-emerald-500" />
            {locale === "hy" ? "Իմ Գնած Առաջարկները" : locale === "ru" ? "Купленные предложения" : "My Purchased Offers"}
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-black transition-colors ${activeTab === "offers"
              ? "bg-emerald-500 text-white shadow-sm"
              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              }`}>
              {claimedOffers.length}
            </span>
          </button>


          <button
            onClick={() => setActiveTab("transfer")}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 border cursor-pointer ${activeTab === "transfer"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-slate-900 dark:border-white shadow-md"
              : "bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
              }`}
          >
            <Coins className="w-3.5 h-3.5" />
            {locale === "hy" ? "Ուղարկել Քոյն" : locale === "ru" ? "Отправить монеты" : "Send Coins"}
          </button>

          <button
            onClick={() => setActiveTab("invite")}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 border cursor-pointer ${activeTab === "invite"
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-slate-900 dark:border-white shadow-md"
              : "bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
              }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            {locale === "hy" ? "Հրավիրել Ընկերներ" : locale === "ru" ? "Пригласить друзей" : "Invite Friends"}
          </button>
        </div>

        {/* ── TAB CONTENT: Profile Info ── */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            {/* Findy Coin Balance Card */}
            <div className="bg-gradient-to-r from-emerald-500/10 via-[hsl(var(--card))] to-[hsl(var(--card))] border border-emerald-500/30 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
                  <Coins className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                    {locale === "hy" ? "Դուք վաստակում եք 5% ամեն ամրագրումից" : locale === "ru" ? "Вы зарабатываете 5% с каждого бронирования" : "You earn 5% back from all your bookings"}
                  </p>
                </div>
              </div>
              <Link href="/exchange#how-it-works" className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold shadow hover:bg-emerald-600 transition-colors shrink-0">
                {locale === "hy" ? "Ինչպե՞ս օգտագործել" : "How to use?"}
              </Link>
            </div>

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
                  className={`p-4 rounded-xl text-sm border flex items-center gap-2 ${profileMsg.type === "success"
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
                {savedBusinesses.map((biz, idx) => {
                  const logo = resolveBusinessLogo(biz);
                  const bannerImg = (Array.isArray(biz.images) && biz.images.length > 0 ? biz.images[0] : "") || biz.coverImageUrl || biz.coverUrl || (Array.isArray(biz.metadata?.coverUrl) ? biz.metadata.coverUrl[0] : biz.metadata?.coverUrl) || logo;
                  return (
                    <div
                      key={`saved-${biz.id || biz.slug}-${idx}`}
                      className="group bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl overflow-hidden hover:shadow-lg transition-all flex flex-col"
                    >
                      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-violet-600/20 to-indigo-900/30 flex items-center justify-center">
                        {bannerImg ? (
                          <img
                            src={bannerImg}
                            alt={biz.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-lg">
                            {biz.name?.charAt(0)?.toUpperCase() || "B"}
                          </div>
                        )}
                        <button
                          onClick={() => removeFavorite(biz.id || biz.slug, biz)}
                          className="absolute top-2.5 right-2.5 p-2 rounded-full bg-black/60 backdrop-blur text-amber-400 hover:text-red-400 hover:bg-black/80 transition-colors shadow z-10 group/btn"
                          title={locale === "hy" ? "Ջնջել պահպանվածներից" : "Remove from favorites"}
                        >
                          <Bookmark className="w-3.5 h-3.5 text-amber-400 fill-amber-400 group-hover/btn:text-red-400 group-hover/btn:fill-red-400/20 transition-colors" />
                        </button>
                        {logo && bannerImg && logo !== bannerImg && (
                          <div className="absolute top-2.5 left-2.5 w-10 h-10 rounded-xl overflow-hidden border-2 border-white dark:border-slate-800 shadow-md bg-white">
                            <img src={logo} alt={biz.name} className="w-full h-full object-cover" />
                          </div>
                        )}
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
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                {locale === "hy" ? "Ստացեք 1% քեշբեք Findy Coins-ով ձեր բոլոր ամրագրումներից" : locale === "ru" ? "Вы получаете 1% кэшбэка от всех ваших бронирований" : "You earn 1% back from all your bookings"}
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
                {userBookings.map((b, idx) => (
                  <div
                    key={`booking-${b.id || idx}-${idx}`}
                    className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-base text-[hsl(var(--foreground))]">{b.businessName}</h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${b.status === "confirmed"
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
                    ? mockMatch.name
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
                                  className={`w-3.5 h-3.5 ${star <= ratingVal
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
                className={`p-4 rounded-xl text-sm border flex items-center gap-2 ${passwordMsg.type === "success"
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

        {/* ── TAB CONTENT: My Purchased Offers ── */}
        {activeTab === "offers" && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="relative overflow-hidden rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
                  <Gift className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[hsl(var(--foreground))]">
                    {locale === "hy" ? "Իմ Գնած Առաջարկները (Findy Coins)" : locale === "ru" ? "Мои купленные предложения (Findy Coins)" : "My Purchased Offers (Findy Coins)"}
                  </h3>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                    {locale === "hy" ? "Այստեղ ցուցադրված են Findy Coins-ով ձեր ձեռք բերած բոլոր առաջարկներն ու զեղչային կուպոնները:" : "Here are all the offers and coupons you purchased using Findy Coins."}
                  </p>
                </div>
              </div>
              <Link href="/exchange" className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow transition-colors shrink-0 flex items-center gap-1.5">
                <Coins className="w-4 h-4" />
                {locale === "hy" ? "Գնել Ավելին" : "Buy More Offers"}
              </Link>
            </div>

            {claimedOffers.length === 0 ? (
              <div className="text-center py-16 px-4 bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                  <Gift className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-[hsl(var(--foreground))]">
                  {locale === "hy" ? "Դեռ չունեք գնված առաջարկներ" : locale === "ru" ? "У вас пока нет купленных предложений" : "No purchased offers yet"}
                </h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-md mx-auto">
                  {locale === "hy"
                    ? "Բացահայտեք Findy Coin Offers էջը, փոխանակեք ձեր կուտակած քոյնները էքսկլյուզիվ առաջարկների հետ:"
                    : "Explore Findy Coin Offers, exchange your accumulated coins for exclusive deals."}
                </p>
                <Link href="/exchange" className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-md transition-all">
                  <Coins className="w-4 h-4" />
                  {locale === "hy" ? "Դիտել Առաջարկները" : "Explore Offers"}
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {claimedOffers.map((item, idx) => {
                  const code = item.couponCode || `FINDY-${Math.floor(100000 + idx * 4521)}`;
                  const fullItem = { ...item, couponCode: code };

                  // Expiry helpers
                  const expiryDate = item.expiresAt
                    ? new Date(item.expiresAt)
                    : item.claimedAt
                      ? new Date(new Date(item.claimedAt).getTime() + 30 * 24 * 60 * 60 * 1000)
                      : null;
                  const daysLeft = expiryDate ? Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
                  const isExpiringSoon = daysLeft !== null && daysLeft <= 7;
                  const expiryLabel = expiryDate
                    ? expiryDate.toLocaleDateString(locale === "hy" ? "hy-AM" : locale === "ru" ? "ru-RU" : "en-US", { day: "numeric", month: "short", year: "numeric" })
                    : null;

                  return (
                    <div
                      key={`${item._id || ""}-${code}-${idx}`}
                      onClick={() => setSelectedCoupon(fullItem)}
                      className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:border-emerald-500/60 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between space-y-4 relative overflow-hidden cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold shrink-0 overflow-hidden group-hover:scale-105 transition-transform">
                            {item.businessLogo ? (
                              <img src={item.businessLogo.startsWith('data:') || item.businessLogo.startsWith('http') ? item.businessLogo : getApiUrl().replace('/api', '') + item.businessLogo} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Gift className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">{item.business || "Business"}</span>
                            <h4 className="font-bold text-[hsl(var(--foreground))] text-base leading-tight mt-0.5">{item.title}</h4>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-extrabold rounded-lg shrink-0 flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5" />
                          {item.cost} Coins
                        </span>
                      </div>

                      {item.description && (
                        <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}

                      <div className="pt-3 border-t border-[hsl(var(--border))]/50 flex flex-col gap-2 text-xs">
                        <div className="flex items-center justify-between">
                          <div className={isExpiringSoon ? "flex items-center gap-1.5 text-orange-500 font-bold" : "flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold"}>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{locale === "hy" ? "Ակտիվ Կուպոն" : "Active Coupon"}</span>
                            {isExpiringSoon && (
                              <span className="ml-1 px-1.5 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/30 text-orange-500 text-[10px] font-extrabold animate-pulse">
                                {locale === "hy" ? `${daysLeft}օր մնաց` : `${daysLeft}d left`}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCoupon(fullItem);
                              }}
                              className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors border border-emerald-500/30"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              <span>QR</span>
                            </button>
                            <div className="bg-[hsl(var(--muted))] px-3 py-1 rounded-lg border border-[hsl(var(--border))] font-mono font-bold text-[11px] text-[hsl(var(--foreground))] group-hover:border-emerald-500/40 transition-colors">
                              {code}
                            </div>
                          </div>
                        </div>
                        {expiryLabel && (
                          <div className={`flex items-center gap-1 ${isExpiringSoon ? "text-orange-400" : "text-[hsl(var(--muted-foreground))]"}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                            <span>
                              {locale === "hy" ? `Վավեր է մինչև ${expiryLabel}` : locale === "ru" ? `Действителен до ${expiryLabel}` : `Valid until ${expiryLabel}`}
                            </span>
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── COUPON QR MODAL ── */}
        {selectedCoupon && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-6 text-center animate-in zoom-in-95 duration-200">
              <button
                type="button"
                onClick={() => setSelectedCoupon(null)}
                className="absolute top-4 right-4 p-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] rounded-full hover:bg-[hsl(var(--muted))] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">{selectedCoupon.business || "Business"}</span>
                <h3 className="text-xl font-black text-[hsl(var(--foreground))]">{selectedCoupon.title}</h3>
              </div>

              {/* QR Code Container */}
              <div className="bg-white p-4 rounded-2xl border-4 border-emerald-500/20 shadow-inner inline-block mx-auto">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(selectedCoupon.couponCode || "FINDY-COUPON")}`}
                  alt="Coupon QR Code"
                  className="w-52 h-52 object-contain mx-auto rounded-lg"
                />
              </div>

              {/* Coupon Code Display (Interactive Copy Badge) */}
              <div className="flex flex-col items-center gap-1.5 mx-auto">
                <button
                  type="button"
                  onClick={() => handleCopyCouponCode(selectedCoupon.couponCode || "FINDY-284076")}
                  className="bg-[hsl(var(--background))] hover:bg-[hsl(var(--muted))] active:scale-95 border border-[hsl(var(--border))] hover:border-emerald-500/50 rounded-xl p-3 inline-flex items-center gap-2.5 mx-auto transition-all cursor-pointer group shadow-sm"
                  title={locale === "hy" ? "Սեղմեք կոդը պատճենելու համար" : "Click to copy code"}
                >
                  <Ticket className="w-4.5 h-4.5 text-emerald-500 group-hover:rotate-12 transition-transform" />
                  <span className="font-mono font-black text-lg tracking-widest text-[hsl(var(--foreground))]">
                    {selectedCoupon.couponCode || "FINDY-284076"}
                  </span>
                  {copiedCouponCode === (selectedCoupon.couponCode || "FINDY-284076") ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 animate-in fade-in">
                      <Check className="w-3.5 h-3.5" />
                      {locale === "hy" ? "Պատճենված է" : "Copied!"}
                    </span>
                  ) : (
                    <Copy className="w-4 h-4 text-[hsl(var(--muted-foreground))] group-hover:text-emerald-500 transition-colors" />
                  )}
                </button>
                <span className="text-[10px] text-[hsl(var(--muted-foreground))] opacity-75">
                  {locale === "hy" ? "Սեղմեք կոդի վրա պատճենելու համար" : "Click code to copy"}
                </span>
              </div>

              <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed max-w-xs mx-auto">
                {locale === "hy"
                  ? "Ցույց տվեք այս QR կոդը բիզնեսի աշխատակցին: Սկանավորելուց կամ հաստատելուց հետո կուպոնը կհանվի ցանկից:"
                  : "Show this QR code to the business staff. Once scanned or confirmed, the coupon will be redeemed and removed."}
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCoupon(null)}
                  className="w-full py-3 bg-[hsl(var(--muted))] hover:bg-[hsl(var(--border))] text-[hsl(var(--foreground))] rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  {locale === "hy" ? "Փակել" : "Close"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB CONTENT: Transfer Coins + History Timeline ── */}
        {activeTab === "transfer" && (
          <div className="animate-in fade-in zoom-in-95 duration-500 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

              {/* LEFT COLUMN: Send Form Card */}
              <div className="lg:col-span-7 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-3xl p-6 sm:p-8 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-6">
                  <Coins className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-black mb-1">{locale === "hy" ? "Ուղարկել ընկերոջը" : "Send to a Friend"}</h3>
                <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] mb-6">{locale === "hy" ? "Անմիջապես փոխանցեք Findy Coins ձեր հրավիրած ընկերներին:" : "Transfer Findy Coins instantly to friends you have invited."}</p>

                <div className="space-y-5">
                  {cooldownRemainingSec > 0 && (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 space-y-2 text-center animate-in fade-in">
                      <div className="flex items-center justify-center gap-2">
                        <Clock className="w-5 h-5 animate-pulse" />
                        <span className="font-extrabold text-sm">
                          {locale === "hy" ? "Օրական Սահմանաչափը Սպառված է (1 փոխանցում / 24ժ)" : "Daily Limit Reached (1 transfer / 24h)"}
                        </span>
                      </div>
                      <p className="text-xs opacity-90 leading-relaxed max-w-sm mx-auto">
                        {locale === "hy"
                          ? "Դուք արդեն կատարել եք Ձեր օրական 1 փոխանցումը: Հաջորդ փոխանցումը հնարավոր կլինի ճիշտ 24 ժամ անց:"
                          : "You have completed your 1 daily transfer limit. Next transfer will be available in 24 hours."}
                      </p>
                      <div className="pt-1">
                        <div className="font-mono text-xl font-black text-amber-500 bg-amber-500/10 px-4 py-1.5 rounded-xl border border-amber-500/20 inline-block shadow-sm">
                          {formatCountdown(cooldownRemainingSec)}
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-bold text-[hsl(var(--muted-foreground))] mb-2 block">{locale === "hy" ? "Ընտրել ընկերոջը" : "Select Friend"}</label>
                    {invitedFriends.length > 0 ? (
                      <select
                        disabled={cooldownRemainingSec > 0}
                        value={selectedFriendUsername}
                        onChange={(e) => setSelectedFriendUsername(e.target.value)}
                        className={`w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl px-4 py-3.5 outline-none focus:border-blue-500 transition-colors text-[hsl(var(--foreground))] font-medium cursor-pointer ${cooldownRemainingSec > 0 ? "opacity-60 cursor-not-allowed" : ""}`}
                      >
                        <option value="">{locale === "hy" ? "-- Ընտրել հրավիրված ընկերոջը --" : "-- Select invited friend --"}</option>
                        {invitedFriends.map((friend: any) => (
                          <option key={friend.username} value={friend.username}>
                            {friend.displayName || friend.username} (@{friend.username})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select
                        disabled
                        className="w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl px-4 py-3.5 outline-none focus:border-blue-500 transition-colors text-[hsl(var(--muted-foreground))] font-medium cursor-not-allowed opacity-75"
                      >
                        <option>
                          {locale === "hy"
                            ? "Դեռևս չկան ընկերներ, ովքեր ակտիվացրել են Ձեր հրավերի կոդը"
                            : "No friends have activated your invite code yet"}
                        </option>
                      </select>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-bold text-[hsl(var(--muted-foreground))]">{locale === "hy" ? "Քանակը" : "Amount to send"}</label>
                      <span className="text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                        {locale === "hy" ? "Առավելագույնը 200 Coin" : "Max 200 Coins"}
                      </span>
                    </div>
                    <div className="relative">
                      <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                      <input
                        type="number"
                        placeholder="0"
                        max={200}
                        disabled={cooldownRemainingSec > 0}
                        value={transferAmount}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "") {
                            setTransferAmount("");
                            return;
                          }
                          const num = Number(val);
                          if (!isNaN(num)) {
                            if (num > 200) {
                              setTransferAmount("200");
                            } else {
                              setTransferAmount(val);
                            }
                          }
                        }}
                        className={`w-full bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl pl-12 pr-4 py-3.5 outline-none focus:border-blue-500 transition-colors font-bold text-lg ${cooldownRemainingSec > 0 ? "opacity-60 cursor-not-allowed" : ""}`}
                      />
                    </div>
                  </div>
                  {transferMsg && (
                    <p className={`text-xs font-semibold px-1 ${transferMsg.type === "success" ? "text-emerald-500" : "text-red-500"}`}>
                      {transferMsg.text}
                    </p>
                  )}
                  <button
                    type="button"
                    disabled={cooldownRemainingSec > 0}
                    onClick={handleTransferCoins}
                    className={`w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 transition-all hover:scale-[1.01] active:scale-95 mt-2 cursor-pointer flex items-center justify-center gap-2 ${cooldownRemainingSec > 0 ? "opacity-50 cursor-not-allowed hover:scale-100 hover:bg-blue-600" : ""}`}
                  >
                    <Send className="w-4 h-4" />
                    <span>{locale === "hy" ? "Հաստատել" : "Confirm Transfer"}</span>
                  </button>
                </div>
              </div>

              {/* RIGHT COLUMN: Transfer History Timeline */}
              <div className="lg:col-span-5 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-3xl p-6 sm:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-[hsl(var(--border))]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-lg leading-tight text-[hsl(var(--foreground))]">
                        {locale === "hy" ? "Փոխանցումների Պատմություն" : "Transfer History"}
                      </h4>
                      <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                        {locale === "hy" ? "Ժամանակագրություն" : "Timeline"}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    {transferHistory.length}
                  </span>
                </div>

                {transferHistory.length > 0 ? (
                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    {transferHistory.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-2xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] flex items-center justify-between gap-3 hover:border-purple-500/40 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-sm shrink-0">
                            {item.recipientDisplayName?.charAt(0)?.toUpperCase() || item.recipientUsername?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-[hsl(var(--foreground))] truncate">
                              {item.recipientDisplayName || item.recipientUsername}
                            </span>
                            <span className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono">
                              @{item.recipientUsername}
                            </span>
                            <span className="text-[10px] text-[hsl(var(--muted-foreground))]/80 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 opacity-60" />
                              {item.dateStr} • {item.timeStr}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
                            -{item.amount} Coins
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-[hsl(var(--muted-foreground))] space-y-2">
                    <Clock className="w-8 h-8 mx-auto opacity-40 mb-2" />
                    <p className="text-xs font-bold">{locale === "hy" ? "Դեռևս փոխանցումներ չկան" : "No transfers yet"}</p>
                    <p className="text-[10px] opacity-75">{locale === "hy" ? "Ձեր կատարած փոխանցումների պատմությունը կհայտնվի այստեղ:" : "History of sent coins will appear here."}</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ── TAB CONTENT: Invite Friends + Invited Friends Panel ── */}
        {activeTab === "invite" && (
          <div className="animate-in fade-in zoom-in-95 duration-500 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

              {/* LEFT COLUMN: Invite & Earn Card */}
              <div className="lg:col-span-7 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-3xl p-6 sm:p-8 shadow-sm text-center">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center mx-auto mb-5">
                  <UserPlus className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black mb-2">{locale === "hy" ? "Հրավիրել և Վաստակել" : "Invite & Earn"}</h3>
                <p className="text-[hsl(var(--muted-foreground))] mb-6 max-w-md mx-auto text-xs sm:text-sm leading-relaxed">
                  {locale === "hy" ? (
                    <>Կիսվեք ձեր հրավերի կոդով կամ հղումով ընկերների հետ: Երբ նրանք գրանցվեն ձեր կոդով, դուք երկուսդ էլ կստանաք <span className="font-bold text-emerald-500">100 Coins!</span></>
                  ) : locale === "ru" ? (
                    <>Поделитесь вашим инвайт-кодом или ссылкой с друзьями. Когда они зарегистрируются по вашему коду, вы оба получите <span className="font-bold text-emerald-500">100 Coins!</span></>
                  ) : (
                    <>Share your unique invite code or link with friends. When they sign up using your code, you both get <span className="font-bold text-emerald-500">100 Coins!</span></>
                  )}
                </p>

                {/* Invite Code & Link Boxes */}
                <div className="space-y-4 max-w-lg mx-auto text-left">
                  {/* 1. Invite Code Box */}
                  <div>
                    <label className="text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider block mb-1.5">
                      {locale === "hy" ? "Ձեր Հրավերի Կոդը (Invite Code)" : locale === "ru" ? "Ваш инвайт-код (Invite Code)" : "Your Invite Code"}
                    </label>
                    <div className={`bg-[hsl(var(--background))] border rounded-2xl p-2 flex items-center gap-2 transition-all ${copiedInviteCode ? "border-emerald-500 shadow-md shadow-emerald-500/10" : "border-[hsl(var(--border))] focus-within:border-emerald-500"}`}>
                      <div className="flex-1 px-4 font-mono font-black text-base sm:text-lg text-emerald-600 dark:text-emerald-400 tracking-wider">
                        {currentUser?.username ? currentUser.username.toUpperCase() : "MHER100"}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyInviteCode(currentUser?.username ? currentUser.username.toUpperCase() : "MHER100")}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer active:scale-95 ${copiedInviteCode
                          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105"
                          : "bg-[hsl(var(--foreground))] text-[hsl(var(--background))] hover:scale-105"
                          }`}
                      >
                        {copiedInviteCode ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-white animate-in zoom-in-50" />
                            <span>{locale === "hy" ? "Պատճենված է!" : locale === "ru" ? "Скопировано!" : "Copied!"}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>{locale === "hy" ? "Պատճենել Կոդը" : locale === "ru" ? "Скопировать Код" : "Copy Code"}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 2. Redeem Invite Code Box */}
                  <div>
                    <label className="text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider block mb-1.5">
                      {locale === "hy" ? "Մուտքագրել Հրավերի Կոդ (100 Coin)" : locale === "ru" ? "Ввести инвайт-код (100 Coin)" : "Enter Invite Code (100 Coins)"}
                    </label>
                    {appliedInviteCode ? (
                      <div className="bg-[hsl(var(--background))] border border-emerald-500/40 rounded-2xl p-2 flex items-center gap-2 shadow-sm bg-emerald-500/5">
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={appliedInviteCode}
                          className="flex-1 bg-transparent px-4 font-mono font-bold text-xs text-[hsl(var(--foreground))] outline-none opacity-80 cursor-not-allowed"
                        />
                        <span className="px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 whitespace-nowrap shrink-0">
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{locale === "hy" ? "Ակտիվացված է (+100 Coin)" : "Activated (+100 Coins)"}</span>
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="bg-[hsl(var(--background))] border border-[hsl(var(--border))] focus-within:border-emerald-500 rounded-2xl p-2 flex items-center gap-2 transition-all">
                          <input
                            type="text"
                            value={inputInviteCode}
                            onChange={(e) => {
                              setInputInviteCode(e.target.value);
                              setInviteCodeMsg(null);
                            }}
                            placeholder={locale === "hy" ? "Մուտքագրեք ուրիշի հրավերի կոդը (օր. edmon008)" : "Enter someone's invite code (e.g. edmon008)"}
                            className="flex-1 bg-transparent px-4 font-mono font-medium text-xs text-[hsl(var(--foreground))] outline-none placeholder:text-[hsl(var(--muted-foreground))]/60"
                          />
                          <button
                            type="button"
                            onClick={handleApplyInviteCode}
                            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 text-white hover:bg-emerald-600 transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20 active:scale-95 shrink-0"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{locale === "hy" ? "Ստանալ 100 Coin" : "Get 100 Coins"}</span>
                          </button>
                        </div>
                        {inviteCodeMsg && (
                          <p className={`text-xs font-semibold px-2 ${inviteCodeMsg.type === "success" ? "text-emerald-500" : "text-red-500"}`}>
                            {inviteCodeMsg.text}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-[hsl(var(--border))]/50 flex justify-center gap-8 text-sm">
                  <div>
                    <p className="font-black text-2xl text-[hsl(var(--foreground))] mb-1">{invitedFriends.length}</p>
                    <p className="text-[hsl(var(--muted-foreground))]">{locale === "hy" ? "Հրավիրված Ընկերներ" : "Friends Invited"}</p>
                  </div>
                  <div>
                    <p className="font-black text-2xl text-emerald-500 mb-1">+{(invitedFriends.length * 100).toLocaleString()}</p>
                    <p className="text-[hsl(var(--muted-foreground))]">{locale === "hy" ? "Վաստակած Քոյններ" : "Coins Earned"}</p>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Invited Friends List Panel */}
              <div className="lg:col-span-5 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-3xl p-6 sm:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-[hsl(var(--border))]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-lg leading-tight text-[hsl(var(--foreground))]">
                        {locale === "hy" ? "Իմ Հրավիրած Ընկերները" : "My Invited Friends"}
                      </h4>
                      <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                        {locale === "hy" ? "Գրանցված Օգտատերեր" : "Registered Users"}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {invitedFriends.length}
                  </span>
                </div>

                {invitedFriends.length > 0 ? (
                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    {invitedFriends.map((friend: any) => (
                      <div
                        key={friend.username}
                        className="p-3.5 rounded-2xl bg-[hsl(var(--background))] border border-[hsl(var(--border))] flex items-center justify-between gap-3 hover:border-emerald-500/40 transition-colors shadow-sm"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-xs font-black shadow-sm shrink-0">
                            {friend.displayName?.charAt(0)?.toUpperCase() || friend.username?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-[hsl(var(--foreground))] truncate">
                              {friend.displayName || friend.username}
                            </span>
                            <span className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono">
                              @{friend.username}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                            <Sparkles className="w-3 h-3 text-emerald-500" />
                            +100 Coins
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-[hsl(var(--muted-foreground))] space-y-2">
                    <UserPlus className="w-8 h-8 mx-auto opacity-40 mb-2" />
                    <p className="text-xs font-bold">{locale === "hy" ? "Դեռևս չկան հրավիրված ընկերներ" : "No invited friends yet"}</p>
                    <p className="text-[10px] opacity-75">{locale === "hy" ? "Ձեր կոդով գրանցված ընկերները կհայտնվեն այստեղ:" : "Friends who register with your code will appear here."}</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}

