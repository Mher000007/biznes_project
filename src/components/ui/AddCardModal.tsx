import React, { useState, useEffect } from "react";
import { X, CreditCard, Lock, ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";
import { useI18n } from "@/i18n";

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCard: (card: { type: string; last4: string; expiry: string; isDefault: boolean; fullNumber?: string }) => void;
}

const getCardType = (number: string) => {
  const cleanNum = number.replace(/\D/g, "");
  if (cleanNum.startsWith("4")) return "visa";
  if (/^5[1-5]/.test(cleanNum) || /^2[2-7]/.test(cleanNum)) return "mastercard";
  if (/^3[47]/.test(cleanNum)) return "amex";
  return "generic";
};

export default function AddCardModal({ isOpen, onClose, onAddCard }: AddCardModalProps) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.body.style.touchAction = "none";
      document.documentElement.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.touchAction = "";
      document.documentElement.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.touchAction = "";
      document.documentElement.style.touchAction = "";
    };
  }, [isOpen]);

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const [showCvc, setShowCvc] = useState(false);
  const [isCvcFocused, setIsCvcFocused] = useState(false);

  const isFlipped = showCvc || isCvcFocused;
  const cardType = getCardType(cardNumber);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate network delay
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        const last4 = cardNumber.replace(/\D/g, "").slice(-4) || "0000";
        onAddCard({
          type: cardType === "visa" ? "Visa" : cardType === "mastercard" ? "Mastercard" : cardType === "amex" ? "Amex" : "Card",
          last4,
          expiry,
          isDefault: false,
          fullNumber: cardNumber
        });
        onClose();
        // Reset form
        setCardNumber("");
        setExpiry("");
        setCvc("");
        setName("");
      }, 1500);
    }, 1500);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\D/g, "");
    const parts = [];
    for (let i = 0; i < v.length; i += 4) {
      parts.push(v.substring(i, i + 4));
    }
    return parts.join(" ");
  };

  const formatExpiry = (value: string) => {
    let v = value.replace(/\D/g, "");
    if (v.length === 1 && parseInt(v) > 1) v = `0${v}`;
    if (v.length >= 2) {
      let month = parseInt(v.substring(0, 2));
      if (month === 0) month = 1;
      if (month > 12) month = 12;
      const monthStr = month.toString().padStart(2, "0");
      v = monthStr + v.substring(2);
    }
    if (v.length >= 3) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  return (
    <div className="fixed inset-0 z-[110] overflow-y-auto overscroll-contain bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6" onClick={onClose}>
        <div 
          className="relative w-full max-w-4xl bg-[hsl(var(--background))] border border-[hsl(var(--border))]/50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] rounded-[2rem] overflow-hidden animate-in zoom-in-[0.98] fade-in duration-300"
          onClick={(e) => e.stopPropagation()}
        >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[hsl(var(--primary))] to-blue-500 shadow-[0_0_10px_rgba(var(--primary),0.5)] z-20" />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-[hsl(var(--muted))]/50 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors z-20 backdrop-blur-sm"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="flex flex-col items-center justify-center p-12 md:p-20 text-center animate-in zoom-in-95 duration-500 min-h-[400px]">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur-xl animate-pulse" />
              <div className="relative w-28 h-28 bg-gradient-to-tr from-emerald-400 to-emerald-600 text-white rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/30 border-4 border-[hsl(var(--background))]">
                <CheckCircle2 className="w-14 h-14" />
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-[hsl(var(--foreground))] mb-3 tracking-tight">{t.billing.addCardModal.cardAdded}</h2>
            <p className="text-[hsl(var(--muted-foreground))] text-lg md:text-xl">{t.billing.addCardModal.cardAddedDesc}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[hsl(var(--border))]/50">
            {/* LEFT COLUMN: Header & Card */}
            <div className="bg-gradient-to-br from-[hsl(var(--muted))]/40 to-transparent p-6 md:p-10 flex flex-col h-full justify-center">
              <div className="mb-10 text-center md:text-left">
                <h2 className="text-3xl md:text-4xl font-black text-[hsl(var(--foreground))] tracking-tight mb-2">
                  {t.billing.addCardModal.title}
                </h2>
                <p className="text-base text-[hsl(var(--muted-foreground))] font-medium">{t.billing.addCardModal.subtitle}</p>
              </div>

              {/* 3D Credit Card Wrapper */}
              <div className="relative w-full max-w-[380px] aspect-[1.586/1] mx-auto group perspective-1000">
                <div
                  className={`relative w-full h-full transition-transform duration-700 hover:scale-[1.03] hover:-translate-y-2 ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* FRONT FACE */}
                  <div
                    className="absolute inset-0 w-full h-full rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-6 flex flex-col justify-between shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6)] overflow-hidden border border-white/10"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <div className="absolute top-0 right-0 w-40 h-40 bg-[hsl(var(--primary))]/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none" />

                    <div className="relative flex justify-between items-start z-10">
                      <div className="w-12 h-10 rounded-md bg-gradient-to-br from-yellow-200 to-yellow-500 shadow-sm opacity-90" />
                      {cardType === "visa" && <span className="text-white font-black italic text-xl drop-shadow-md">VISA</span>}
                      {cardType === "mastercard" && <div className="flex -space-x-3"><div className="w-8 h-8 rounded-full bg-red-500/80 mix-blend-screen" /><div className="w-8 h-8 rounded-full bg-yellow-500/80 mix-blend-screen" /></div>}
                      {cardType === "generic" && <CreditCard className="w-8 h-8 text-white/50" />}
                    </div>
                    <div className="relative z-10 mt-auto">
                      <p className="text-white/90 font-mono text-xl sm:text-2xl tracking-[0.15em] mb-4 text-shadow-sm drop-shadow-md">
                        {cardNumber ? formatCardNumber(cardNumber) : "•••• •••• •••• ••••"}
                      </p>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold mb-1">{t.billing.paymentModal.cardHolder}</p>
                          <p className="text-white font-medium tracking-wide truncate max-w-[150px] uppercase text-sm drop-shadow-md">
                            {name || t.billing.paymentModal.nameSurname}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold mb-1">{t.billing.paymentModal.expires}</p>
                          <p className="text-white font-medium tracking-widest font-mono text-sm drop-shadow-md">
                            {expiry || "MM/YY"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BACK FACE */}
                  <div
                    className="absolute inset-0 w-full h-full rounded-[2rem] bg-gradient-to-br from-slate-900 to-slate-950 flex flex-col shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6)] overflow-hidden border border-white/10"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                  >
                    <div className="w-full h-12 bg-black mt-8" />
                    <div className="px-6 mt-6">
                      <div className="w-full bg-white/10 rounded-md h-10 flex items-center justify-end px-4 backdrop-blur-sm">
                        <span className="text-white font-mono tracking-widest">{cvc || "•••"}</span>
                      </div>
                      <p className="text-[10px] text-white/40 mt-2 text-right">{t.billing.addCardModal.securityCode}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-center gap-2 text-[hsl(var(--muted-foreground))] text-xs font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                {t.billing.addCardModal.encrypted}
              </div>
            </div>

            {/* RIGHT COLUMN: Form */}
            <div className="p-6 md:p-10 bg-[hsl(var(--background))]">
              <form onSubmit={handleSave} className="h-full flex flex-col justify-center">
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[hsl(var(--foreground))] uppercase tracking-wider">{t.billing.paymentModal.cardNumber}</label>
                    <div className="relative group">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--muted-foreground))] group-focus-within:text-[hsl(var(--primary))] transition-colors" />
                      <input
                        type="text"
                        required
                        maxLength={19}
                        placeholder="0000 0000 0000 0000"
                        value={formatCardNumber(cardNumber)}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full h-14 pl-12 pr-4 rounded-xl border-2 border-[hsl(var(--border))]/60 bg-[hsl(var(--muted))]/20 text-[hsl(var(--foreground))] font-mono text-base focus:border-[hsl(var(--primary))] focus:bg-[hsl(var(--background))] focus:ring-4 focus:ring-[hsl(var(--primary))]/10 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[hsl(var(--foreground))] uppercase tracking-wider">{t.billing.paymentModal.expiryDate}</label>
                      <input
                        type="text"
                        required
                        maxLength={5}
                        placeholder="MM/YY"
                        value={formatExpiry(expiry)}
                        onChange={(e) => setExpiry(e.target.value)}
                        className="w-full h-14 px-4 rounded-xl border-2 border-[hsl(var(--border))]/60 bg-[hsl(var(--muted))]/20 text-[hsl(var(--foreground))] font-mono text-base focus:border-[hsl(var(--primary))] focus:bg-[hsl(var(--background))] focus:ring-4 focus:ring-[hsl(var(--primary))]/10 transition-all outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[hsl(var(--foreground))] uppercase tracking-wider flex justify-between">
                        <span>CVC</span>
                      </label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--muted-foreground))] group-focus-within:text-[hsl(var(--primary))] transition-colors" />
                        <input
                          type={showCvc ? "text" : "password"}
                          required
                          maxLength={4}
                          placeholder="123"
                          value={cvc}
                          onChange={(e) => setCvc(e.target.value.replace(/\D/g, ""))}
                          onFocus={() => setIsCvcFocused(true)}
                          onBlur={() => setIsCvcFocused(false)}
                          className="w-full h-14 pl-12 pr-4 rounded-xl border-2 border-[hsl(var(--border))]/60 bg-[hsl(var(--muted))]/20 text-[hsl(var(--foreground))] font-mono text-base focus:border-[hsl(var(--primary))] focus:bg-[hsl(var(--background))] focus:ring-4 focus:ring-[hsl(var(--primary))]/10 transition-all outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[hsl(var(--foreground))] uppercase tracking-wider">{t.billing.addCardModal.nameOnCard}</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-14 px-4 rounded-xl border-2 border-[hsl(var(--border))]/60 bg-[hsl(var(--muted))]/20 text-[hsl(var(--foreground))] text-base focus:border-[hsl(var(--primary))] focus:bg-[hsl(var(--background))] focus:ring-4 focus:ring-[hsl(var(--primary))]/10 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    type="submit"
                    disabled={loading || cardNumber.length < 15 || expiry.length < 5 || cvc.length < 3 || !name}
                    className="group relative w-full h-14 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-black tracking-widest uppercase transition-all disabled:opacity-50 flex items-center justify-center overflow-hidden hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[hsl(var(--primary))]/30"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                    <span className="relative z-10 flex items-center gap-2">
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" /> {t.billing.addCardModal.saving}
                        </>
                      ) : (
                        <>
                          {t.billing.addCardModal.saveCard}
                        </>
                      )}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
