"use client";
import { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
const axiosInstance = axios;
import { useRouter } from "next/navigation";
import { getApiUrl } from "@/lib/utils";
import {
  AlertTriangle,
  Loader2,
  Trash2,
  X,
  Lock,
  Key,
  Copy,
  Check,
  Users,
  Globe,
  Eye,
  EyeOff,
  ShieldCheck,
  UserCheck,
  Code,
  Settings2,
  Sparkles,
  User,
  ShieldAlert,
  Smartphone,
  Palette,
  Laptop
} from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function SettingsPage() {
  const { currentUser, logout, refreshUser } = useAuth();
  const router = useRouter();

  // Navigation
  const [activeSettingsTab, setActiveSettingsTab] = useState<"account" | "security" | "integrations" | "display" | "danger">("account");

  // Account Profile States
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileMessageType, setProfileMessageType] = useState<"success" | "error" | "">("");

  // Change Password States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordMessageType, setPasswordMessageType] = useState<"success" | "error" | "">("");

  // 2FA Mock State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Widget & API Key States
  const [businessSlug, setBusinessSlug] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [copiedApi, setCopiedApi] = useState(false);

  // Localization States
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState("Asia/Yerevan");
  const { theme: selectedTheme, setTheme: setSelectedTheme } = useTheme();

  // Danger Zone Deletion States
  const [showModal, setShowModal] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.name || "");
      setEmail(currentUser.email || "");
      setPhone(currentUser.phone || "");
      setBio((currentUser as any).bio || "");
    }
  }, [currentUser]);

  // Load business info for slug
  useEffect(() => {
    async function loadBusinessInfo() {
      try {
        const apiURL = getApiUrl();
        const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
        const res = await axiosInstance.get(`${apiURL}/businesses/me/all`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.data?.success && res.data.data?.length > 0) {
          setBusinessSlug(res.data.data[0].slug || "");
        }
      } catch (err) {
        console.warn("Could not retrieve business slug for embed code", err);
      }
    }
    loadBusinessInfo();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setProfileMessage("");
    setProfileMessageType("");
    try {
      const apiURL = getApiUrl();
      const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
      const res = await axiosInstance.put(
        `${apiURL}/auth/profile`,
        { name: fullName, phone, bio },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (res.data?.success) {
        setProfileMessageType("success");
        setProfileMessage("Պրոֆիլը հաջողությամբ թարմացվեց:");
        if (refreshUser) await refreshUser();
      }
    } catch (err: any) {
      setProfileMessageType("error");
      setProfileMessage(err.response?.data?.message || "Չհաջողվեց թարմացնել պրոֆիլը:");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      setPasswordMessageType("error");
      setPasswordMessage("Նոր գաղտնաբառերը չեն համընկնում:");
      return;
    }
    setChangingPassword(true);
    setPasswordMessage("");
    setPasswordMessageType("");
    try {
      const apiURL = getApiUrl();
      const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
      await axiosInstance.put(
        `${apiURL}/auth/change-password`,
        { currentPassword, newPassword },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setPasswordMessageType("success");
      setPasswordMessage("Գաղտնաբառը հաջողությամբ թարմացվեց:");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMessageType("error");
      setPasswordMessage(err.response?.data?.message || "Չհաջողվեց թարմացնել գաղտնաբառը:");
    } finally {
      setChangingPassword(false);
    }
  };

  const generateApiKey = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let key = "pk_live_";
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setApiKey(key);
  };

  const copyEmbedCode = () => {
    const embedHtml = `<iframe src="https://armbiz.am/embed/widget/${businessSlug || "business"}" width="100%" height="450" style="border:none; border-radius:12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);"></iframe>`;
    navigator.clipboard.writeText(embedHtml);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedApi(true);
    setTimeout(() => setCopiedApi(false), 2000);
  };

  const handleDeleteBusiness = async () => {
    if (!currentUser) return;
    const userEmail = currentUser.email || "";
    if (emailInput.trim().toLowerCase() !== userEmail.trim().toLowerCase()) {
      setDeleteError("Մուտքագրված էլ. հասցեն չի համընկնում:");
      return;
    }
    setLoading(true);
    setDeleteError("");
    try {
      const apiURL = getApiUrl();
      const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
      const listRes = await axiosInstance.get(`${apiURL}/businesses/me/all`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (listRes.data?.success && listRes.data.data?.length > 0) {
        const bizId = listRes.data.data[0]._id;
        await axiosInstance.delete(`${apiURL}/businesses/${bizId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
      }
      logout();
      router.push("/");
    } catch (err: any) {
      console.error("Error during deletion", err);
      setDeleteError(err.response?.data?.message || "Տեղի է ունեցել սխալ:");
      setLoading(false);
    }
  };

  const embedHtml = `<iframe src="https://armbiz.am/embed/widget/${businessSlug || "business"}" width="100%" height="450" style="border:none; border-radius:12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);"></iframe>`;

  const tabsList = [
    { id: "account", label: "Profile Details", icon: User },
    { id: "security", label: "Security & Credentials", icon: Lock },
    { id: "integrations", label: "Embed Widgets & API", icon: Code },
    { id: "display", label: "Display Preferences", icon: Settings2 },
    { id: "danger", label: "Danger Zone", icon: AlertTriangle },
  ] as const;

  return (
    <ProtectedRoute>
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight mb-1">Settings & Preferences</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Manage workspace preferences, developer API options, security credentials, and embeds.</p>
        </div>

        {/* Outer Split-Screen Settings Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT PANEL: Nav Subtabs */}
          <div className="lg:col-span-3 flex flex-col gap-1.5 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-[hsl(var(--muted-foreground))] tracking-wider px-3 mb-2">Settings Section</span>
            {tabsList.map((t) => {
              const Icon = t.icon;
              const isActive = activeSettingsTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveSettingsTab(t.id)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold cursor-pointer transition-colors text-left ${isActive
                      ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
                      : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/55 hover:text-[hsl(var(--foreground))]"
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* RIGHT PANEL: Settings Form Content */}
          <div className="lg:col-span-9 space-y-6">

            {/* SUBTAB 1: ACCOUNT PROFILE */}
            {activeSettingsTab === "account" && (
              <form onSubmit={handleUpdateProfile} className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 shadow-sm space-y-6 animate-scale-in">
                <div>
                  <h3 className="text-base font-bold text-[hsl(var(--foreground))]">Account Profile</h3>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Update your profile parameters visible across listings.</p>
                </div>

                {/* Profile Picture Mock Wrapper */}
                <div className="flex items-center gap-4 border-b border-[hsl(var(--border))]/50 pb-5">
                  <div className="relative h-16 w-16 rounded-full bg-[hsl(var(--muted))] border border-[hsl(var(--border))] flex items-center justify-center text-[hsl(var(--muted-foreground))] overflow-hidden group">
                    <User className="h-8 w-8" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer">
                      <Sparkles className="h-4 w-4 text-white animate-pulse" />
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[hsl(var(--foreground))]">Profile Avatar</span>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">JPG, PNG, or WEBP up to 2MB. Drag and drop placeholder.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2.5 text-xs text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--primary))] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 px-3 py-2.5 text-xs text-[hsl(var(--muted-foreground))] outline-none cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Phone Number</label>
                    <input
                      type="text"
                      placeholder="e.g. +374 90 000000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2.5 text-xs text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--primary))] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Bio / Short Description</label>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Short description of your profile..."
                    className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3 text-xs text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--primary))] transition-colors resize-none"
                  />
                </div>

                {profileMessage && (
                  <div className={`p-3 rounded-lg text-xs font-medium ${profileMessageType === "success" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                    }`}>
                    {profileMessage}
                  </div>
                )}

                <div className="flex justify-end border-t border-[hsl(var(--border))]/50 pt-4">
                  <button
                    type="submit"
                    disabled={updatingProfile}
                    className="btn-primary px-4 py-2 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
                  >
                    {updatingProfile ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    Save Profile Settings
                  </button>
                </div>
              </form>
            )}

            {/* SUBTAB 2: SECURITY & 2FA */}
            {activeSettingsTab === "security" && (
              <div className="space-y-6 animate-scale-in">
                {/* Change Password Block */}
                <form onSubmit={handlePasswordChange} className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-[hsl(var(--foreground))]">Security Credentials</h3>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">Update account passwords and configure safety standards.</p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium mb-1 text-[hsl(var(--muted-foreground))]">Current Password</label>
                      <div className="relative">
                        <input
                          type={showCurrent ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                          className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] pl-3 pr-10 py-2 text-xs text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--primary))]"
                        />
                        <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-2.5 text-[hsl(var(--muted-foreground))] hover:text-foreground">
                          {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1 text-[hsl(var(--muted-foreground))]">New Password</label>
                      <div className="relative">
                        <input
                          type={showNew ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] pl-3 pr-10 py-2 text-xs text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--primary))]"
                        />
                        <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-2.5 text-[hsl(var(--muted-foreground))] hover:text-foreground">
                          {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1 text-[hsl(var(--muted-foreground))]">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showConfirm ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] pl-3 pr-10 py-2 text-xs text-[hsl(var(--foreground))] outline-none focus:border-[hsl(var(--primary))]"
                        />
                        <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-2.5 text-[hsl(var(--muted-foreground))] hover:text-foreground">
                          {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {passwordMessage && (
                    <div className={`p-3 rounded-lg text-xs font-medium ${passwordMessageType === "success" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                      }`}>
                      {passwordMessage}
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={changingPassword}
                      className="px-4 py-2 text-xs font-bold bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90 rounded-lg cursor-pointer flex items-center gap-1.5"
                    >
                      {changingPassword && <Loader2 className="h-3 w-3 animate-spin" />}
                      Change Password
                    </button>
                  </div>
                </form>

                {/* Mock Two-Factor Auth Box */}
                <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-[hsl(var(--primary))]/10 rounded-xl text-[hsl(var(--primary))] shrink-0">
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[hsl(var(--foreground))]">Two-Factor Authentication (2FA)</h4>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 leading-relaxed max-w-xl">
                        Add an extra layer of security by requiring a code from your authenticator app (e.g. Google Authenticator) in addition to password.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                    className={`shrink-0 px-4 py-2 text-xs font-bold rounded-lg transition-colors border cursor-pointer ${twoFactorEnabled
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20"
                        : "bg-[hsl(var(--muted))]/30 border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/60"
                      }`}
                  >
                    {twoFactorEnabled ? "2FA Active (Toggle Off)" : "Activate 2FA"}
                  </button>
                </div>
              </div>
            )}

            {/* SUBTAB 3: INTEGRATIONS & EMBDED */}
            {activeSettingsTab === "integrations" && (
              <div className="space-y-6 animate-scale-in">
                {/* Embed widget block */}
                <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-[hsl(var(--foreground))]">Embed Review Widget</h3>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">Embed a booking and review canvas of your business profile onto your personal website.</p>
                  </div>

                  <div className="bg-[hsl(var(--muted))]/20 p-3 rounded-xl border border-[hsl(var(--border))]/40 relative">
                    <code className="text-[10px] text-purple-400 break-all select-all font-mono leading-relaxed block pr-16">{embedHtml}</code>
                    <button
                      onClick={copyEmbedCode}
                      className="absolute right-3 top-2.5 p-2 bg-[hsl(var(--card))] hover:bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-lg text-[hsl(var(--muted-foreground))] hover:text-foreground transition-all cursor-pointer"
                      title="Copy embed code"
                    >
                      {copiedEmbed ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-[hsl(var(--muted-foreground))]">
                    <Code className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
                    <span>Copy the iframe markup above and paste it anywhere in your website's HTML templates.</span>
                  </div>
                </div>

                {/* API Key generation block */}
                <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-[hsl(var(--foreground))]">Developer API Keys</h3>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">Use API keys to request business listings, schedules, and inquiry logs programmatically.</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={generateApiKey}
                      className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors cursor-pointer"
                    >
                      {apiKey ? "Regenerate API Key" : "Generate Live API Key"}
                    </button>
                    {apiKey && (
                      <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Live</span>
                    )}
                  </div>

                  {apiKey && (
                    <div className="bg-[hsl(var(--muted))]/20 p-3 rounded-xl border border-[hsl(var(--border))]/40 relative flex items-center justify-between gap-4 animate-scale-in">
                      <span className="text-xs font-mono font-bold text-gray-300 break-all select-all tracking-wider">{apiKey}</span>
                      <button
                        onClick={copyApiKey}
                        className="p-2 bg-[hsl(var(--card))] hover:bg-[hsl(var(--muted))] border border-[hsl(var(--border))] rounded-lg text-[hsl(var(--muted-foreground))] hover:text-foreground transition-all shrink-0 cursor-pointer"
                        title="Copy Key"
                      >
                        {copiedApi ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  )}
                </div>

                {/* Workspace Collaboration Mock */}
                <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-[hsl(var(--foreground))]">Workspace Collaborators</h3>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">Manage team members and configure role-based access control.</p>
                  </div>

                  <div className="divide-y divide-[hsl(var(--border))]/40 border border-[hsl(var(--border))]/60 rounded-xl overflow-hidden bg-[hsl(var(--background))] text-xs">
                    <div className="flex justify-between items-center px-4 py-3 bg-[hsl(var(--muted))]/20">
                      <span className="font-bold">Member</span>
                      <span className="font-bold">Role</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3">
                      <span>{email}</span>
                      <span className="font-bold text-emerald-500 flex items-center gap-1.5"><UserCheck size={13} /> Workspace Owner</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3 text-[hsl(var(--muted-foreground))]">
                      <span>collaborator-invite@armbiz.am (Pending)</span>
                      <span className="font-medium bg-[hsl(var(--muted))]/40 px-2 py-0.5 rounded-full text-[10px]">Manager</span>
                    </div>
                  </div>

                  {/* Invite collaborator input */}
                  <div className="flex gap-2 items-center flex-wrap pt-2">
                    <input
                      type="email"
                      placeholder="Enter collaborator email"
                      className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-xs outline-none focus:border-[hsl(var(--primary))]"
                    />
                    <select className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-xs outline-none">
                      <option value="manager">Manager</option>
                      <option value="viewer">Viewer (Readonly)</option>
                    </select>
                    <button type="button" className="px-3.5 py-2 text-xs font-bold bg-[hsl(var(--primary))]/10 hover:bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))] rounded-lg transition-colors cursor-pointer">Invite</button>
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 4: LOCALIZATION & DISPLAY */}
            {activeSettingsTab === "display" && (
              <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 shadow-sm space-y-6 animate-scale-in">
                <div>
                  <h3 className="text-base font-bold text-[hsl(var(--foreground))]">Display & Localizations</h3>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Configure dashboard language, timezone parameters, and active themes.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">System Language</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2.5 text-xs text-[hsl(var(--foreground))] outline-none"
                    >
                      <option value="en">English (US)</option>
                      <option value="hy">Armenian (Հայերեն)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Local Timezone</label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2.5 text-xs text-[hsl(var(--foreground))] outline-none"
                    >
                      <option value="Asia/Yerevan">Asia/Yerevan (GMT+4)</option>
                      <option value="GMT">Greenwich Mean Time (GMT)</option>
                    </select>
                  </div>
                </div>

                {/* Theme cards selectors */}
                <div>
                  <label className="block text-xs font-medium mb-3 text-[hsl(var(--muted-foreground))]">Dashboard Interface Theme</label>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { key: "light", title: "Light Mode", icon: Globe },
                      { key: "dark", title: "Dark Mode", icon: Palette },
                      { key: "system", title: "System Default", icon: Laptop },
                    ].map((th) => {
                      const Icon = th.icon;
                      const active = selectedTheme === th.key;
                      return (
                        <div
                          key={th.key}
                          onClick={() => setSelectedTheme(th.key as "light" | "dark" | "system")}
                          className={`rounded-xl border p-4 cursor-pointer flex flex-col items-center justify-center gap-2 text-center transition-all ${active
                              ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5 text-[hsl(var(--foreground))]"
                              : "border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]/50 text-[hsl(var(--muted-foreground))]"
                            }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-xs font-bold">{th.title}</span>
                          {active && <Check className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 5: DANGER ZONE */}
            {activeSettingsTab === "danger" && (
              <div className="bg-[hsl(var(--card))] border border-red-200 dark:border-red-900 bg-red-500/5 rounded-2xl p-6 shadow-sm space-y-4 animate-scale-in">
                <div>
                  <h3 className="text-base font-bold text-red-600">Danger Zone</h3>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Once deleted, your business listing cannot be recovered. All reviews, inquiries, and analytics will be permanently destroyed.</p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setDeleteError("");
                      setEmailInput("");
                      setShowModal(true);
                    }}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white cursor-pointer transition-colors"
                  >
                    Delete Business Listing
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-[hsl(var(--muted-foreground))] hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3 text-red-600 mb-4">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950/50">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">Ջնջել բիզնես պրոֆիլը</h3>
              </div>

              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
                Արդյո՞ք ցանկանում եք ջնջել ցանցից Ձեր պրոֆիլը։ Այս գործողությունը անդառնալի է և Ձեր բոլոր տվյալները կորելու են։
              </p>

              <div className="space-y-3 mb-6">
                <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))]">
                  Հաստատելու համար մուտքագրեք Ձեր էլ. հասցեն ({currentUser?.email})
                </label>
                <input
                  type="email"
                  placeholder="Մուտքագրեք Ձեր էլ. հասցեն"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2.5 text-sm outline-none focus:border-red-500 transition-colors"
                />
                {deleteError && (
                  <p className="text-xs font-medium text-red-500">{deleteError}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={loading}
                  className="h-9 px-4 rounded-lg text-xs font-medium border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-colors disabled:opacity-50"
                >
                  Չեղարկել
                </button>
                <button
                  onClick={handleDeleteBusiness}
                  disabled={loading || emailInput.trim().toLowerCase() !== (currentUser?.email || "").trim().toLowerCase()}
                  className="h-9 px-4 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {loading ? (
                    <><Loader2 className="h-3 w-3 animate-spin" /> Ջնջվում է...</>
                  ) : (
                    <><Trash2 className="h-3 w-3" /> Հաստատել ջնջումը</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
