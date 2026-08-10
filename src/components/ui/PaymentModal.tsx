import React, { useState } from "react";
import { X, CreditCard, Lock, ShieldCheck, CheckCircle2, Loader2 } from "lucide-react";
import { useI18n } from "@/i18n";

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

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");

  if (!isOpen) return null;

  const planTitle = plan === "premium" ? t.billing.plans.premium.title : t.billing.plans.standard.title;
  const planPrice = plan === "premium" ? "50,000 AMD" : "20,000 AMD";
  const planDesc = plan === "premium" ? t.billing.plans.premium.desc : t.billing.plans.standard.desc;

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
      }, 1500);
    }, 2000);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-[hsl(var(--background))] border border-[hsl(var(--border))] shadow-2xl rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--border))] transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-6 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-[hsl(var(--foreground))] mb-2">Payment Successful!</h2>
            <p className="text-[hsl(var(--muted-foreground))]">Your plan has been upgraded to {planTitle}.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="bg-[hsl(var(--muted))]/30 p-6 md:p-8 border-b border-[hsl(var(--border))]">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${plan === 'premium' ? 'bg-amber-500/20 text-amber-500' : 'bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))]'}`}>
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">Complete Payment</h2>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">Upgrade to {planTitle}</p>
                </div>
              </div>
              <div className="bg-[hsl(var(--background))] p-4 rounded-xl border border-[hsl(var(--border))] flex justify-between items-center shadow-sm">
                <div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] font-semibold uppercase tracking-wider mb-1">Total Due</p>
                  <p className="text-2xl font-black text-[hsl(var(--foreground))]">{planPrice}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[hsl(var(--muted-foreground))] font-semibold uppercase tracking-wider mb-1">Plan</p>
                  <p className="text-sm font-bold text-[hsl(var(--foreground))] capitalize">{plan}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handlePay} className="p-6 md:p-8 space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2">Cardholder Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[hsl(var(--primary))]/50 focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2">Card Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="0000 0000 0000 0000"
                      className="w-full pl-11 pr-4 py-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[hsl(var(--primary))]/50 focus:border-transparent outline-none transition-all font-mono"
                    />
                    <CreditCard className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2">Expiry Date</label>
                    <input
                      type="text"
                      required
                      maxLength={5}
                      value={expiry}
                      onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                      className="w-full px-4 py-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[hsl(var(--primary))]/50 focus:border-transparent outline-none transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2">CVC</label>
                    <input
                      type="text"
                      required
                      maxLength={4}
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, ''))}
                      placeholder="123"
                      className="w-full px-4 py-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl text-sm font-medium focus:ring-2 focus:ring-[hsl(var(--primary))]/50 focus:border-transparent outline-none transition-all font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-center gap-2 text-[11px] font-medium text-[hsl(var(--muted-foreground))] mb-6">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Payments are secure and encrypted.</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl bg-[hsl(var(--foreground))] text-[hsl(var(--background))] hover:bg-[hsl(var(--foreground))]/90 text-sm font-bold transition-all disabled:opacity-70 flex items-center justify-center shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Processing...</>
                ) : (
                  <><Lock className="w-4 h-4 mr-2" /> Pay {planPrice}</>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
