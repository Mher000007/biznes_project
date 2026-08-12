import React, { useState, useEffect } from "react";
import { X, CreditCard, Lock, ShieldCheck, CheckCircle2, Loader2, Sparkles, Eye, EyeOff } from "lucide-react";
import { useI18n } from "@/i18n";

const getCardType = (number: string) => {
  const cleanNum = number.replace(/\D/g, "");
  if (cleanNum.startsWith("4")) return "visa";
  if (/^5[1-5]/.test(cleanNum) || /^2[2-7]/.test(cleanNum)) return "mastercard";
  if (/^3[47]/.test(cleanNum)) return "amex";
  return "generic";
};

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: "starter" | "standard" | "premium";
  onSuccess: (plan: "starter" | "standard" | "premium") => void;
}

export default function PaymentModal({ isOpen, onClose, plan, onSuccess }: PaymentModalProps) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const [showCvc, setShowCvc] = useState(false);
  const [isCvcFocused, setIsCvcFocused] = useState(false);

  const isFlipped = showCvc || isCvcFocused;

  if (!isOpen) return null;

  const planTitle = plan === "premium" ? t.billing.plans.premium.title : t.billing.plans.standard.title;
  const planPrice = plan === "premium" ? "50,000 AMD" : "20,000 AMD";

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate payment process
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSuccess(plan);
        onClose();
        // Reset form
        setCardNumber("");
        setExpiry("");
        setCvc("");
        setName("");
      }, 4000);
    }, 2000);
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

    if (v.length === 1 && parseInt(v) > 1) {
      v = `0${v}`;
    }

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div
        className="relative w-full max-w-4xl bg-[hsl(var(--background))] border border-[hsl(var(--border))]/50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] rounded-[2rem] overflow-hidden animate-in zoom-in-[0.98] fade-in duration-300 transition-all"
        onClick={(e) => e.stopPropagation()}
      >


        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-[hsl(var(--muted))]/50 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors z-20 backdrop-blur-sm"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="flex flex-col items-center justify-center p-8 md:p-12 w-full min-h-[500px]">
            <div className="relative w-full max-w-[320px] mx-auto flex flex-col items-center perspective-1000">
              {/* Printer Slot */}
              <div className="w-[105%] h-6 bg-gradient-to-b from-slate-800 to-black rounded-md relative z-30 shadow-[0_20px_40px_rgba(0,0,0,0.6),inset_0_2px_1px_rgba(255,255,255,0.15)] border-b-[3px] border-slate-900 flex items-center justify-center overflow-hidden">
                {/* Deep inner shadow / slot gap */}
                <div className="w-[94%] h-2 bg-black rounded-full shadow-[inset_0_4px_8px_rgba(0,0,0,1)] relative overflow-hidden">
                   {/* Printing laser glow */}
                   <div className="absolute top-0 left-0 w-full h-full bg-emerald-500/20 blur-[2px] animate-[scan_1.5s_ease-in-out_infinite]" />
                </div>
              </div>

              {/* Receipt Container */}
              <div className="w-[90%] relative overflow-hidden h-[420px] z-20 -mt-2">
                <div className="absolute top-0 left-0 w-full bg-[#fcfbfa] shadow-[0_20px_40px_rgba(0,0,0,0.3),inset_0_0_40px_rgba(0,0,0,0.03)] flex flex-col pb-6 animate-[slideDown_2.5s_cubic-bezier(0.2,0.8,0.2,1)_forwards] border-x border-slate-200/60"
                     style={{
                       animationFillMode: 'forwards',
                       backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.04'/%3E%3C/svg%3E")`
                     }}
                >
                  {/* Faint Watermark (FQ Logo) */}
                  <img src="/fq-logo.png" alt="Watermark" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 opacity-[0.04] grayscale mix-blend-multiply pointer-events-none object-contain" />

                  {/* Top of receipt - plain white for slot margin */}
                  <div className="w-full h-8" />
                  
                  {/* Content */}
                  <div className="px-6 text-slate-800 text-center flex-1 relative z-10">
                     <div className="w-12 h-12 bg-emerald-500 rounded-full mx-auto flex items-center justify-center mb-4 shadow-sm border-2 border-emerald-100">
                       <CheckCircle2 className="w-6 h-6 text-white" />
                     </div>
                     
                     <h3 className="font-black text-xl mb-1 tracking-tight uppercase text-emerald-600" style={{ fontFamily: 'monospace' }}>APPROVED</h3>
                     <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-4 font-mono">{t.billing.receipts.receiptId} #TRX-{Math.floor(100000 + Math.random() * 900000)}</p>
                     
                     <div className="border-t-[1.5px] border-dashed border-slate-400 w-full my-4 opacity-50" />
                     
                     <div className="flex justify-between items-center text-xs mb-3 font-mono">
                       <span className="font-bold text-slate-500">{t.billing.receipts.plan}</span>
                       <span className="font-bold text-slate-900">{planTitle}</span>
                     </div>
                     <div className="flex justify-between items-center text-xs mb-3 font-mono">
                       <span className="font-bold text-slate-500">{t.billing.receipts.amount}</span>
                       <span className="font-black text-slate-900 text-sm">{planPrice}</span>
                     </div>
                     <div className="flex justify-between items-center text-xs mb-3 font-mono">
                       <span className="font-bold text-slate-500">{t.billing.receipts.date}</span>
                       <span className="font-bold text-slate-800">{new Date().toLocaleDateString()}</span>
                     </div>
                     <div className="flex justify-between items-center text-xs mb-3 font-mono">
                       <span className="font-bold text-slate-500">{t.billing.receipts.method}</span>
                       <span className="font-bold text-slate-800">•••• {cardNumber.slice(-4) || "4083"}</span>
                     </div>

                     <div className="border-t-[1.5px] border-dashed border-slate-400 w-full my-4 opacity-50" />
                     
                     <div className="flex justify-center items-center gap-[2px] h-10 mt-4 opacity-80 px-2 w-full mix-blend-multiply">
                        {[2,1,4,1,2,3,1,1,4,2,1,3,2,1,4,1,2,3,1,1,4,2,1,3,1,2,4,1,2].map((w, i) => (
                          <div key={i} className="bg-slate-900 h-full" style={{ width: `${w}px` }} />
                        ))}
                     </div>
                     <p className="text-[8px] font-mono mt-1.5 tracking-[0.3em] opacity-50 font-bold">{t.billing.receipts.thankYou}</p>
                  </div>

                  {/* Jagged Bottom Edge via SVG mask to match texture */}
                  <div className="absolute bottom-[-10px] left-0 w-full h-[10px]"
                       style={{
                         backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 12 10' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0l6 10 6-10z' fill='%23fcfbfa'/%3E%3C/svg%3E")`,
                         backgroundSize: '12px 10px',
                         backgroundRepeat: 'repeat-x'
                       }}
                  />
                </div>
              </div>
              
              {/* Global Style for Keyframe */}
              <style dangerouslySetInnerHTML={{__html: `
                @keyframes slideDown {
                  0% { transform: translateY(-100%); }
                  100% { transform: translateY(0); }
                }
                @keyframes scan {
                  0%, 100% { opacity: 0.3; }
                  50% { opacity: 1; }
                }
              `}} />

            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[hsl(var(--border))]/50">
            {/* LEFT COLUMN: Header & Card */}
            <div className="bg-gradient-to-br from-[hsl(var(--muted))]/40 to-transparent p-6 md:p-10 flex flex-col h-full">

              <div className="mb-10">
                <h2 className="text-3xl md:text-4xl font-black text-[hsl(var(--foreground))] tracking-tight flex items-center gap-3">
                  {t.billing.paymentModal.upgradePlan}
                </h2>
                <p className="text-base text-[hsl(var(--muted-foreground))] mt-2 font-medium">{t.billing.paymentModal.completePayment} {planTitle}</p>
                <div className="mt-6 inline-block bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl px-4 py-2 shadow-sm">
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] font-bold uppercase tracking-[0.2em] mb-0.5">{t.billing.paymentModal.totalDue}</p>
                  <p className="text-2xl font-black text-[hsl(var(--foreground))] text-amber-500">{planPrice}</p>
                </div>
              </div>

              <div className="flex-1" />

              {/* 3D Credit Card Wrapper */}
              <div className="relative w-full max-w-[380px] aspect-[1.586/1] mx-auto group" style={{ perspective: '1000px' }}>
                <div
                  className={`relative w-full h-full transition-transform duration-700 hover:scale-[1.03] hover:-translate-y-2 ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* FRONT FACE */}
                  <div
                    className="absolute inset-0 w-full h-full rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-6 flex flex-col justify-between shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6)] overflow-hidden border border-white/10"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    {/* Decorative glowing orb */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none transition-all duration-700 group-hover:bg-emerald-500/30" />

                    {/* Glass reflection */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

                    {/* Card Header (Chip & Logo) */}
                    <div className="flex justify-between items-start relative z-10">
                      <div className="w-12 h-9 rounded-lg flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-amber-200 to-amber-400 shadow-[inset_0_1px_3px_rgba(255,255,255,0.4),0_2px_4px_rgba(0,0,0,0.2)] border border-amber-100/40">
                        {/* Chip lines */}
                        <div className="absolute inset-y-0 left-1/2 w-[1px] bg-black/15" />
                        <div className="absolute inset-x-0 top-1/2 h-[1px] bg-black/15" />
                        <div className="absolute inset-x-0 top-1/4 h-[1px] bg-black/15" />
                        <div className="absolute inset-x-0 bottom-1/4 h-[1px] bg-black/15" />
                      </div>
                      {/* Brand / NFC */}
                      <div className="flex items-center justify-end h-8 opacity-90 min-w-[60px] transition-all duration-300">
                        {getCardType(cardNumber) === 'visa' ? (
                          <span className="text-3xl font-black italic tracking-tighter text-white drop-shadow-md">VISA</span>
                        ) : getCardType(cardNumber) === 'mastercard' ? (
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-[#eb001b]/90 backdrop-blur-md mix-blend-screen" />
                            <div className="w-8 h-8 rounded-full bg-[#f79e1b]/90 backdrop-blur-md -ml-3 mix-blend-screen" />
                          </div>
                        ) : getCardType(cardNumber) === 'amex' ? (
                          <span className="text-lg font-black tracking-widest text-white bg-blue-500/40 px-2 py-0.5 rounded shadow-sm border border-white/20">AMEX</span>
                        ) : (
                          <div className="flex items-center gap-1.5 opacity-80">
                            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md" />
                            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md -ml-5" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Number */}
                    <div className="relative z-10 font-mono text-[19px] sm:text-[22px] tracking-[0.1em] sm:tracking-[0.15em] text-white drop-shadow-md w-full text-center transition-all duration-300 mt-2 whitespace-nowrap">
                      {cardNumber || "••••  ••••  ••••  ••••"}
                    </div>

                    {/* Card Details */}
                    <div className="flex justify-between items-end relative z-10">
                      <div className="flex-1 overflow-hidden pr-4">
                        <p className="text-[10px] text-white uppercase tracking-widest mb-1">{t.billing.paymentModal.cardHolder}</p>
                        <p className="font-medium text-white uppercase tracking-wider truncate w-full text-xs sm:text-sm drop-shadow-sm">
                          {name || t.billing.paymentModal.nameSurname}
                        </p>
                      </div>
                      <div className="text-right whitespace-nowrap">
                        <p className="text-[10px] text-white uppercase tracking-widest mb-1">{t.billing.paymentModal.expires}</p>
                        <p className="font-mono text-xs sm:text-sm text-white tracking-widest drop-shadow-sm">{expiry || "MM/YY"}</p>
                      </div>
                    </div>
                  </div>

                  {/* BACK FACE */}
                  <div
                    className="absolute inset-0 w-full h-full rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex flex-col shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6)] overflow-hidden border border-white/10"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                  >
                    {/* Decorative glowing orb */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none transition-all duration-700" />

                    {/* Magnetic Stripe */}
                    <div className="w-full h-12 bg-black/80 mt-6 shadow-inner relative z-10" />

                    {/* CVC Strip */}
                    <div className="flex-1 flex flex-col justify-center px-6 relative z-10">
                      <p className="text-[10px] text-white/60 uppercase tracking-widest text-right mb-1 mr-2">{t.billing.paymentModal.cvc}</p>
                      <div className="w-full bg-slate-200 h-10 rounded flex items-center justify-end px-4 overflow-hidden relative shadow-inner">
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, #000 2px, #000 4px)' }}></div>
                        <span className="relative z-10 font-mono text-slate-800 font-bold tracking-widest text-lg">{cvc ? (showCvc ? cvc : '•'.repeat(cvc.length)) : '•••'}</span>
                      </div>
                    </div>

                    {/* Bottom Text */}
                    <div className="px-6 pb-6 text-right relative z-10">
                      <p className="text-[8px] text-white/40 uppercase tracking-widest">{t.billing.paymentModal.authorizedSignature}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Form */}
            <form onSubmit={handlePay} className="p-6 md:p-10 flex flex-col h-full">
              <div className="space-y-6">
                <div>
                  <label className="block text-[11px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-2.5">{t.billing.paymentModal.cardHolder}</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value.replace(/[^\p{L}\s]/gu, "").toUpperCase())}
                    placeholder={t.billing.paymentModal.nameSurname}
                    className="w-full px-5 py-4 bg-[hsl(var(--muted))]/40 border border-[hsl(var(--border))]/80 rounded-2xl text-sm font-medium focus:bg-[hsl(var(--background))] focus:ring-2 focus:ring-[hsl(var(--primary))]/30 focus:border-[hsl(var(--primary))] outline-none transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-2.5">{t.billing.paymentModal.cardNumber}</label>
                  <div className="relative group">
                    <input
                      type="text"
                      required
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="0000 0000 0000 0000"
                      className="w-full pl-14 pr-5 py-4 bg-[hsl(var(--muted))]/40 border border-[hsl(var(--border))]/80 rounded-2xl text-sm font-medium focus:bg-[hsl(var(--background))] focus:ring-2 focus:ring-[hsl(var(--primary))]/30 focus:border-[hsl(var(--primary))] outline-none transition-all font-mono shadow-sm"
                    />
                    <CreditCard className="w-6 h-6 absolute left-5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] group-focus-within:text-[hsl(var(--primary))] transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-2.5">{t.billing.paymentModal.expiryDate}</label>
                    <input
                      type="text"
                      required
                      maxLength={5}
                      value={expiry}
                      onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                      className="w-full px-5 py-4 bg-[hsl(var(--muted))]/40 border border-[hsl(var(--border))]/80 rounded-2xl text-sm font-medium focus:bg-[hsl(var(--background))] focus:ring-2 focus:ring-[hsl(var(--primary))]/30 focus:border-[hsl(var(--primary))] outline-none transition-all font-mono shadow-sm text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-2.5">{t.billing.paymentModal.cvc}</label>
                    <div className="relative group">
                      <input
                        type={showCvc ? "text" : "password"}
                        required
                        maxLength={3}
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value.replace(/\D/g, ''))}
                        onFocus={() => setIsCvcFocused(true)}
                        onBlur={() => setIsCvcFocused(false)}
                        placeholder="•••"
                        className="w-full px-5 py-4 pr-12 bg-[hsl(var(--muted))]/40 border border-[hsl(var(--border))]/80 rounded-2xl text-sm font-medium focus:bg-[hsl(var(--background))] focus:ring-2 focus:ring-[hsl(var(--primary))]/30 focus:border-[hsl(var(--primary))] outline-none transition-all font-mono shadow-sm text-center tracking-[0.3em]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCvc(!showCvc)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors rounded-full hover:bg-[hsl(var(--muted))]/50"
                      >
                        {showCvc ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-[2rem]" />

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full py-5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-900 text-base font-black tracking-widest uppercase transition-all disabled:opacity-70 flex items-center justify-center shadow-[0_10px_30px_-5px_rgba(245,158,11,0.5)] hover:shadow-[0_20px_40px_-5px_rgba(245,158,11,0.6)] hover:-translate-y-1 active:translate-y-0 overflow-hidden bg-[length:200%_auto] hover:bg-[position:right_center]"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative z-10 flex items-center gap-2.5">
                  {loading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> {t.billing.paymentModal.processing}</>
                  ) : (
                    <><Lock className="w-5 h-5" /> {t.billing.paymentModal.pay} {planPrice}</>
                  )}
                </span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
