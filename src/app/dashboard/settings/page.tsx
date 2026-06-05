"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { deleteBusinessProfile } from "@/lib/auth";
import axios from "axios";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function SettingsPage() {
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.displayName || currentUser.username || "");
      setEmail(currentUser.email || "");
    }
  }, [currentUser]);

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
      // 1. Attempt delete on backend
      const apiURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
      
      try {
        const listRes = await axios.get(`${apiURL}/businesses/me/all`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        if (listRes.data?.success && listRes.data.data?.length > 0) {
          const bizId = listRes.data.data[0]._id;
          await axios.delete(`${apiURL}/businesses/${bizId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
        }
      } catch (err) {
        console.warn("Backend delete failed or not configured, skipping", err);
      }

      // 2. Delete locally from mock database
      deleteBusinessProfile(currentUser.username);

      // 3. Logout the user
      logout();

      // Redirect to homepage
      router.push("/");
    } catch (err: any) {
      console.error("Error during deletion", err);
      setDeleteError(err.response?.data?.message || "Տեղի է ունեցել սխալ: Խնդրում ենք փորձել կրկին:");
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight mb-1">Settings</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Manage your account preferences.</p>
        </div>

        <div className="max-w-2xl space-y-6">
          {/* Account */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-5">
            <h2 className="text-sm font-semibold">Account</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Full Name</label>
                <input 
                  type="text" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2.5 text-sm outline-none" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Email</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2.5 text-sm outline-none" 
                />
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 space-y-4">
            <h2 className="text-sm font-semibold">Notifications</h2>
            {[
              { label: "Email notifications for new inquiries", defaultChecked: true },
              { label: "Weekly analytics report", defaultChecked: true },
              { label: "Marketing updates", defaultChecked: false },
            ].map((opt) => (
              <label key={opt.label} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked={opt.defaultChecked} className="h-4 w-4 rounded border accent-[hsl(var(--primary))]" />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>

          {/* Danger zone */}
          <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-[hsl(var(--card))] p-6">
            <h2 className="text-sm font-semibold text-red-600 mb-2">Danger Zone</h2>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-4">Once deleted, your business listing cannot be recovered.</p>
            <button 
              onClick={() => {
                setDeleteError("");
                setEmailInput("");
                setShowModal(true);
              }}
              className="h-9 px-4 rounded-lg text-xs font-semibold border border-red-300 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
            >
              Delete Business
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
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
