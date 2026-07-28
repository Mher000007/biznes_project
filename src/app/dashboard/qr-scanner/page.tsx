"use client";

import { useState, useEffect } from "react";
import { QrCode, Scan, CheckCircle2, AlertCircle, RefreshCw, Sparkles, ShieldCheck, History, Trash2, Search, UserCheck, Ticket } from "lucide-react";
import { useI18n } from "@/i18n";
import { useAuth } from "@/context/AuthContext";

export interface RedeemedCoupon {
  id: string;
  couponCode: string;
  offerTitle: string;
  businessName: string;
  cost: number;
  customerName: string;
  customerEmail?: string;
  redeemedAt: string;
}

export default function QrScannerPage() {
  const { locale } = useI18n();
  const { currentUser } = useAuth();
  const [manualCode, setManualCode] = useState("");
  const [scanResult, setScanResult] = useState<{ status: "idle" | "success" | "error"; message?: string; details?: RedeemedCoupon }>({ status: "idle" });
  const [isScanning, setIsScanning] = useState(false);
  const [redeemedList, setRedeemedList] = useState<RedeemedCoupon[]>([]);
  const [searchFilter, setSearchFilter] = useState("");

  // Load redeemed coupons history
  const loadRedeemedCoupons = () => {
    if (typeof window === "undefined") return;
    try {
      const str = localStorage.getItem("armbiz_redeemed_coupons");
      if (str) {
        setRedeemedList(JSON.parse(str));
      } else {
        setRedeemedList([]);
      }
    } catch (e) {
      setRedeemedList([]);
    }
  };

  useEffect(() => {
    loadRedeemedCoupons();
    const handleUpdate = () => loadRedeemedCoupons();
    window.addEventListener("redeemedCouponsUpdated", handleUpdate);
    return () => window.removeEventListener("redeemedCouponsUpdated", handleUpdate);
  }, []);

  const handleVerifyCode = (inputCode: string) => {
    const cleanCode = inputCode.trim().toUpperCase();
    if (!cleanCode) return;
    setIsScanning(true);

    setTimeout(() => {
      setIsScanning(false);
      try {
        // 1. Check if already redeemed
        const existingRedeemedStr = localStorage.getItem("armbiz_redeemed_coupons");
        const existingRedeemed: RedeemedCoupon[] = existingRedeemedStr ? JSON.parse(existingRedeemedStr) : [];
        
        const alreadyRedeemed = existingRedeemed.find((item) => item.couponCode.toUpperCase() === cleanCode);
        if (alreadyRedeemed) {
          setScanResult({
            status: "error",
            message: locale === "hy"
              ? `Այս կոդը (${cleanCode}) արդեն վավերացվել և օգտագործվել է:`
              : `This coupon (${cleanCode}) has already been redeemed.`,
          });
          return;
        }

        // 2. Check user's claimed offers in localStorage
        const claimedStr = localStorage.getItem("armbiz_user_claimed_offers");
        const claimedList: any[] = claimedStr ? JSON.parse(claimedStr) : [];
        const matchedIndex = claimedList.findIndex((item) => item.couponCode && item.couponCode.toUpperCase() === cleanCode);

        let newRecord: RedeemedCoupon;

        if (matchedIndex !== -1) {
          const matchedItem = claimedList[matchedIndex];
          
          // Remove from claimed offers (so it disappears from My Purchased Offers)
          const updatedClaimedList = claimedList.filter((_, idx) => idx !== matchedIndex);
          localStorage.setItem("armbiz_user_claimed_offers", JSON.stringify(updatedClaimedList));
          window.dispatchEvent(new Event("claimedOffersUpdated"));

          newRecord = {
            id: `redeemed-${Date.now()}-${Math.random()}`,
            couponCode: matchedItem.couponCode || cleanCode,
            offerTitle: matchedItem.title || "Coin Offer",
            businessName: matchedItem.business || currentUser?.name || "Business",
            cost: matchedItem.cost || 0,
            customerName: matchedItem.userName || currentUser?.name || currentUser?.username || "Անուն Ազգանուն",
            customerEmail: matchedItem.userEmail || currentUser?.email || "",
            redeemedAt: new Date().toISOString(),
          };
        } else if (cleanCode.startsWith("FINDY-") || cleanCode.startsWith("OFFER-") || cleanCode.length >= 6) {
          // Demo / Direct verification fallback
          newRecord = {
            id: `redeemed-${Date.now()}-${Math.random()}`,
            couponCode: cleanCode,
            offerTitle: locale === "hy" ? "20% Զեղչ հատուկ ճաշացանկի համար" : "20% Discount Special Set",
            businessName: currentUser?.name || "Business",
            cost: 50,
            customerName: "Արմեն Մ․",
            customerEmail: "armen@example.com",
            redeemedAt: new Date().toISOString(),
          };
        } else {
          setScanResult({
            status: "error",
            message: locale === "hy" ? "Անվավեր կամ գոյություն չունեցող QR կոդ:" : "Invalid or non-existent QR code.",
          });
          return;
        }

        // Save to redeemed history
        const updatedRedeemed = [newRecord, ...existingRedeemed];
        localStorage.setItem("armbiz_redeemed_coupons", JSON.stringify(updatedRedeemed));
        setRedeemedList(updatedRedeemed);
        window.dispatchEvent(new Event("redeemedCouponsUpdated"));

        setScanResult({
          status: "success",
          message: locale === "hy"
            ? "QR Կոդը հաջողությամբ վավերացված է: Կուպոնը հեռացվել է հաճախորդի քարտերից:"
            : "QR Code Successfully Verified! Coupon removed from customer wallet.",
          details: newRecord,
        });

        setManualCode("");
      } catch (e) {
        console.error("Verification error:", e);
        setScanResult({
          status: "error",
          message: locale === "hy" ? "Ստուգման ընթացքում տեղի ունեցավ սխալ:" : "An error occurred during verification.",
        });
      }
    }, 600);
  };

  const handleClearHistory = () => {
    if (confirm(locale === "hy" ? "Վստա՞հ եք, որ ցանկանում եք մաքրել վավերացված կուպոնների պատմությունը:" : "Are you sure you want to clear redeemed coupon history?")) {
      localStorage.removeItem("armbiz_redeemed_coupons");
      setRedeemedList([]);
      window.dispatchEvent(new Event("redeemedCouponsUpdated"));
    }
  };

  const filteredList = redeemedList.filter((item) => {
    const q = searchFilter.toLowerCase();
    return (
      item.couponCode.toLowerCase().includes(q) ||
      item.customerName.toLowerCase().includes(q) ||
      item.offerTitle.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[hsl(var(--border))]/60 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[hsl(var(--foreground))]">
              {locale === "hy" ? "QR Սկաներ և Վավերացում" : locale === "ru" ? "QR Сканер и Проверка" : "QR Scanner & Verification"}
            </h1>
          </div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {locale === "hy"
              ? "Ստուգեք հաճախորդների QR/կուպոնային կոդերը (օրինակ՝ FINDY-218245): Հաստատելուց հետո կուպոնը կհեռանա հաճախորդի My Purchased Offers բաժնից:"
              : "Verify customer QR/coupon codes (e.g., FINDY-218245). Upon confirmation, the coupon is automatically redeemed and saved."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Visual Scanner Box */}
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-3xl p-6 shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="w-full aspect-square max-w-[280px] bg-[hsl(var(--muted))]/30 border-2 border-dashed border-emerald-500/40 rounded-2xl flex flex-col items-center justify-center relative p-6 group hover:border-emerald-500 transition-colors">
            <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
            
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Scan className="w-8 h-8 animate-pulse" />
            </div>
            <p className="text-sm font-semibold text-[hsl(var(--foreground))] mb-1">
              {locale === "hy" ? "Տեսախցիկի / QR Սկան" : "Camera / QR Scan"}
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-4">
              {locale === "hy" ? "Պահեք QR կոդը տեսախցիկի առջև կամ փորձարկեք կոդով" : "Point camera at customer QR code or test demo"}
            </p>

            <button
              onClick={() => handleVerifyCode("FINDY-218245")}
              disabled={isScanning}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{locale === "hy" ? "Ստուգվում է..." : "Verifying..."}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{locale === "hy" ? "Փորձնական Սկան (FINDY-218245)" : "Test Scan (FINDY-218245)"}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Manual Code Input & Verification Result */}
        <div className="space-y-6">
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[hsl(var(--foreground))] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span>{locale === "hy" ? "Ձեռքով մուտքագրում" : locale === "ru" ? "Ручной ввод" : "Manual Code Input"}</span>
            </h3>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                {locale === "hy" ? "Կուպոնի / QR Կոդ" : "Coupon / QR Code"}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyCode(manualCode)}
                  placeholder="օրինակ՝ FINDY-218245"
                  className="flex-1 px-4 py-3 bg-[hsl(var(--muted))]/40 border border-[hsl(var(--border))] rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
                />
                <button
                  onClick={() => handleVerifyCode(manualCode)}
                  disabled={!manualCode.trim() || isScanning}
                  className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap"
                >
                  {locale === "hy" ? "Ստուգել" : "Verify"}
                </button>
              </div>
            </div>
          </div>

          {/* Verification Result Feedback */}
          {scanResult.status === "success" && scanResult.details && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-6 space-y-3 animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-3 text-emerald-500 font-bold text-base">
                <CheckCircle2 className="w-6 h-6 shrink-0" />
                <span>{scanResult.message}</span>
              </div>
              <div className="pl-9 text-xs space-y-1.5 text-[hsl(var(--foreground))] border-t border-emerald-500/20 pt-3">
                <p><span className="font-semibold opacity-70">Կուպոնի Կոդ:</span> <code className="bg-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold text-emerald-600 dark:text-emerald-400">{scanResult.details.couponCode}</code></p>
                <p><span className="font-semibold opacity-70">Առաջարկ:</span> {scanResult.details.offerTitle}</p>
                <p><span className="font-semibold opacity-70">Հաճախորդ:</span> <strong className="text-emerald-600 dark:text-emerald-400">{scanResult.details.customerName}</strong> {scanResult.details.customerEmail ? `(${scanResult.details.customerEmail})` : ''}</p>
                <p><span className="font-semibold opacity-70">Ամսաթիվ:</span> {new Date(scanResult.details.redeemedAt).toLocaleString()}</p>
              </div>
            </div>
          )}

          {scanResult.status === "error" && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-6 flex items-center gap-3 text-red-500 font-bold text-sm animate-in zoom-in-95 duration-300">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <span>{scanResult.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* Redeemed History Table / Section */}
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[hsl(var(--border))]/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">
                {locale === "hy" ? "Վավերացված Կուպոնների Պատմություն" : "Redeemed Coupons History"}
              </h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                {locale === "hy" ? `Ընդհանուր՝ ${redeemedList.length} վավերացված առաջարկ` : `Total: ${redeemedList.length} redeemed items`}
              </p>
            </div>
          </div>

          {redeemedList.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder={locale === "hy" ? "Որոնել կոդով կամ անունով..." : "Search..."}
                  className="pl-9 pr-3 py-1.5 bg-[hsl(var(--muted))]/30 border border-[hsl(var(--border))] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <button
                onClick={handleClearHistory}
                className="p-2 text-[hsl(var(--muted-foreground))] hover:text-red-500 rounded-xl hover:bg-red-500/10 transition-colors"
                title={locale === "hy" ? "Մաքրել պատմությունը" : "Clear History"}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {filteredList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[hsl(var(--border))]/60 text-[hsl(var(--muted-foreground))] font-semibold uppercase tracking-wider">
                  <th className="pb-3 px-3">{locale === "hy" ? "Հաճախորդ" : "Customer"}</th>
                  <th className="pb-3 px-3">{locale === "hy" ? "Կուպոնի Կոդ" : "Coupon Code"}</th>
                  <th className="pb-3 px-3">{locale === "hy" ? "Առաջարկ" : "Offer"}</th>
                  <th className="pb-3 px-3">{locale === "hy" ? "Ամսաթիվ" : "Date"}</th>
                  <th className="pb-3 px-3 text-right">{locale === "hy" ? "Կարգավիճակ" : "Status"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]/40">
                {filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-[hsl(var(--muted))]/20 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs">
                          <UserCheck className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-bold text-[hsl(var(--foreground))]">{item.customerName}</p>
                          {item.customerEmail && <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{item.customerEmail}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="bg-[hsl(var(--muted))] px-2.5 py-1 rounded-lg border border-[hsl(var(--border))] font-mono font-bold text-[11px] text-[hsl(var(--foreground))]">
                        {item.couponCode}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-[hsl(var(--foreground))] line-clamp-1">{item.offerTitle}</p>
                      <p className="text-[10px] text-emerald-500 font-semibold">{item.cost} Coins</p>
                    </td>
                    <td className="py-3 px-3 text-[hsl(var(--muted-foreground))]">
                      {new Date(item.redeemedAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 font-extrabold text-[10px]">
                        <CheckCircle2 className="w-3 h-3" />
                        {locale === "hy" ? "Վավերացված" : "Validated"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-[hsl(var(--muted-foreground))] space-y-2">
            <Ticket className="w-8 h-8 mx-auto opacity-40 mb-2" />
            <p className="text-sm font-semibold">
              {locale === "hy" ? "Վավերացված կուպոններ դեռ չկան" : "No redeemed coupons yet"}
            </p>
            <p className="text-xs opacity-70">
              {locale === "hy"
                ? "Սկանավորեք կամ մուտքագրեք հաճախորդի կոդը՝ առաջին վավերացումը կատարելու համար:"
                : "Scan or enter a code to complete the first verification."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
