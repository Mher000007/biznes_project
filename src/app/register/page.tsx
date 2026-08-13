"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { CATEGORIES } from "@/lib/constants";
import { LocationSelect } from "@/components/ui/LocationSelect";
import { saveBusinessProfile } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import { Building2, CheckCircle, ChevronRight, ChevronLeft, ShieldCheck, Sparkles, Star, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { getApiUrl } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n";
import styles from "./Register.module.scss";

const CURRENT_YEAR = new Date().getFullYear();

const LocationPicker = dynamic(() => import("@/components/map/LocationPicker"), {
  ssr: false,
  loading: () => <div className="h-[250px] rounded-xl bg-[hsl(var(--muted))] animate-pulse" />,
});

const DEFAULT_HOURS = [
  { day: "Monday", open: "09:00", close: "18:00", closed: false },
  { day: "Tuesday", open: "09:00", close: "18:00", closed: false },
  { day: "Wednesday", open: "09:00", close: "18:00", closed: false },
  { day: "Thursday", open: "09:00", close: "18:00", closed: false },
  { day: "Friday", open: "09:00", close: "18:00", closed: false },
  { day: "Saturday", open: "09:00", close: "18:00", closed: false },
  { day: "Sunday", open: "09:00", close: "18:00", closed: true },
];

interface MenuItem {
  name: string;
  price: string;
  description: string;
  category: string;
}

interface ServiceItem {
  name: string;
  price: string;
  description: string;
  duration: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { currentUser, register: authRegister } = useAuth();
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Dynamic steps setup
  const stepsList = currentUser
    ? [t.register.businessDetails, t.register.contactAddress]
    : [t.register.accountSetup, t.register.businessDetails, t.register.contactAddress];

  // Step 0 (if !currentUser) - Account setup credentials
  const [accountUsername, setAccountUsername] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [confirmAccountPassword, setConfirmAccountPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation states
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(false);

  const [emailError, setEmailError] = useState<string | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isEmailAvailable, setIsEmailAvailable] = useState(false);

  // Business Details fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState("horeca");
  const [shortDesc, setShortDesc] = useState("");
  const [foundedYear, setFoundedYear] = useState("");

  // Contact details fields
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [lat, setLat] = useState(40.1872);
  const [lng, setLng] = useState(44.5152);

  // Dynamic data list
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    { name: "Traditional Khorovats", price: "3500", description: "Pork BBQ with Armenian spices", category: "Main Dish" },
    { name: "Tzhvzhik", price: "2400", description: "Traditional beef liver dish", category: "Appetizer" }
  ]);

  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([
    { name: "Full Oil Change", price: "8000", description: "Engine oil change with filter replacement", duration: "30 mins" },
    { name: "Tire Balancing", price: "4000", description: "Computerized wheel balancing", duration: "15 mins" }
  ]);

  // Subscription setup removed

  // Check username availability
  useEffect(() => {
    if (!accountUsername || accountUsername.trim() === "") {
      setUsernameError(null);
      setIsUsernameAvailable(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsCheckingUsername(true);
      try {
        const response = await api.get(`/auth/check-availability?username=${accountUsername}`);
        if (response.data?.usernameTaken) {
          setUsernameError(t.auth.usernameTaken);
          setIsUsernameAvailable(false);
        } else {
          setUsernameError(null);
          setIsUsernameAvailable(true);
        }
      } catch (err) {
        console.error("Failed to check username availability", err);
        setIsUsernameAvailable(false);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [accountUsername]);

  // Check email availability
  useEffect(() => {
    if (!accountEmail || accountEmail.trim() === "" || !accountEmail.includes("@")) {
      setEmailError(null);
      setIsEmailAvailable(false);
      return;
    }
    
    const timeoutId = setTimeout(async () => {
      setIsCheckingEmail(true);
      try {
        const response = await api.get(`/auth/check-availability?email=${accountEmail}`);
        if (response.data?.emailTaken) {
          setEmailError(t.auth.emailTaken);
          setIsEmailAvailable(false);
        } else {
          setEmailError(null);
          setIsEmailAvailable(true);
        }
      } catch (err) {
        console.error("Failed to check email availability", err);
        setIsEmailAvailable(false);
      } finally {
        setIsCheckingEmail(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [accountEmail]);

  const isPasswordValid = (pw: string) => {
    return pw.length >= 8 && /[A-Z]/.test(pw) && /\d/.test(pw) && /[^A-Za-z0-9]/.test(pw);
  };

  const canProceed = () => {
    if (!currentUser) {
      switch (step) {
        case 0: return accountUsername && !usernameError && accountEmail && !emailError && isPasswordValid(accountPassword) && accountPassword === confirmAccountPassword;
        case 1: return name && category && shortDesc;
        case 2: return city && phone.length === 8 && email;
        default: return true;
      }
    } else {
      switch (step) {
        case 0: return name && category && shortDesc;
        case 1: return city && phone.length === 8 && email;
        default: return true;
      }
    }
  };

  const handleNext = () => {
    if (canProceed()) {
      setStep(s => s + 1);
    }
  };

  const addMenuItem = () => {
    setMenuItems([...menuItems, { name: "", price: "", description: "", category: "Main Dish" }]);
  };

  const removeMenuItem = (index: number) => {
    setMenuItems(menuItems.filter((_, i) => i !== index));
  };

  const updateMenuItem = (index: number, field: keyof MenuItem, value: string) => {
    const updated = [...menuItems];
    updated[index] = { ...updated[index], [field]: value };
    setMenuItems(updated);
  };

  const addServiceItem = () => {
    setServiceItems([...serviceItems, { name: "", price: "", description: "", duration: "30 mins" }]);
  };

  const removeServiceItem = (index: number) => {
    setServiceItems(serviceItems.filter((_, i) => i !== index));
  };

  const updateServiceItem = (index: number, field: keyof ServiceItem, value: string) => {
    const updated = [...serviceItems];
    updated[index] = { ...updated[index], [field]: value };
    setServiceItems(updated);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setSaveError(null);

    let activeUser = currentUser;
    let activeUsername = currentUser?.username;

    // 1. Account registration if not logged in
    if (!currentUser) {
      try {
        const authResult = await authRegister({
          username: accountUsername,
          displayName: name || accountUsername,
          email: accountEmail,
          password: accountPassword,
          accountType: "business",
          phone: "+374" + phone,
          contactEmail: email
        });

        if (!authResult.success) {
          setSaveError(authResult.error || "Failed to establish partner credentials.");
          setLoading(false);
          return;
        }
        activeUser = authResult.user || null;
        activeUsername = authResult.user?.username || accountUsername;
      } catch (err: any) {
        setSaveError(err.message || "Failed to register user account.");
        setLoading(false);
        return;
      }
    }

    // 2. Format services/menu
    const formattedServices = category !== "horeca" ? serviceItems.filter(i => i.name.trim() !== "").map(item => ({
      name: item.name,
      description: item.description,
      price: Number(item.price) || 0,
      duration: item.duration
    })) : [];

    const formattedMenu = category === "horeca" ? menuItems.filter(i => i.name.trim() !== "").map(item => ({
      name: item.name,
      description: item.description,
      price: Number(item.price) || 0,
      category: item.category
    })) : [];

    const selectedCategoryObject = CATEGORIES.find(c => c.slug === category);

    // 3. Try backend listing creation
    try {
      const payload = {
        name,
        description: shortDesc,
        category: selectedCategoryObject?.id || category,
        email,
        phone: "+374" + phone,
        address: address || "Yerevan, Armenia",
        city,
        country: "Armenia",
        website,
        services: formattedServices,
        menu: formattedMenu,
        coordinates: {
          latitude: lat,
          longitude: lng,
        },
        layoutConfig: {
          themeColor: "#0f172a",
          displayLogo: true,
          displayGallery: true,
          layoutType: category === "horeca" ? "horeca" : "standard"
        }
      };

      const response = await api.post("/businesses/onboard", payload);

      if (response.data?.success && response.data.data?._id) {
        // Business created successfully (subscription will be picked later from dashboard)
      }
    } catch (err: any) {
      console.warn("Backend DB onboarding failed, proceeding with localStorage fallback", err.message);
      if (err.response?.status === 401) {
        setSaveError("Your session is invalid or expired. Please refresh the page to log in again.");
        setLoading(false);
        return;
      }
    }

    // 4. Fallback localStorage sync
    const result = saveBusinessProfile({
      ownerUsername: activeUsername || "guest_vendor",
      businessName: name,
      category,
      shortDesc: shortDesc,
      fullDesc: shortDesc,
      foundedYear,
      city,
      address: address || "Yerevan, Armenia",
      latitude: lat,
      longitude: lng,
      phone: "+374" + phone,
      email,
      website,
      services: category !== "horeca" ? serviceItems : [],
      operatingHours: DEFAULT_HOURS,
      instagram: "",
      facebook: "",
      telegram: "",
      linkedin: "",
      tags: category,
      createdAt: new Date().toISOString()
    } as any);

    setLoading(false);
    if (!result.success) {
      setSaveError(result.error ?? "Unable to complete onboarding registration.");
    } else {
      router.push("/dashboard");
    }
  };
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.iconWrapper}>
          <Building2 className="h-6 w-6" />
        </div>
        <h1>{t.register.partnerOnboarding}</h1>
        <p>{t.register.onboardingSub}</p>
      </div>

      {/* Progress */}
      <div className={styles.progressContainer}>
        <div className={styles.progressBar}>
          {stepsList.map((s, i) => (
            <div key={s} className={styles.progressStep}>
              <div className={`${styles.stepCircle} ${i < step ? styles.completed : i === step ? styles.active : ""}`}>
                {i < step ? "✓" : i + 1}
              </div>
              <div className={`${styles.stepLabel} ${i === step ? styles.active : ""}`}>{s}</div>
            </div>
          ))}
        </div>
      </div>

      {saveError && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {saveError}
        </div>
      )}

      {/* Card Content */}
      <div className={styles.card}>
        <h2>{stepsList[step]}</h2>

        {/* Step: Account Setup (Only if not logged in) */}
        {!currentUser && step === 0 && (
          <div className="space-y-4">
            <div className={styles.formGroup}>
              <label>{t.register.selectUsername}</label>
              <div className="relative">
                <input
                  value={accountUsername}
                  onChange={e => setAccountUsername(e.target.value)}
                  type="text"
                  placeholder={t.register.usernamePlaceholder}
                  className="w-full pr-10 transition-all duration-300"
                  style={{ 
                    borderColor: usernameError ? "#ef4444" : isUsernameAvailable ? "#22c55e" : undefined,
                    boxShadow: usernameError ? "0 0 0 1px rgba(239, 68, 68, 0.2)" : isUsernameAvailable ? "0 0 0 1px rgba(34, 197, 94, 0.2)" : undefined
                  }}
                />
                {isCheckingUsername && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="h-4 w-4 rounded-full border-2 border-[hsl(var(--muted-foreground))] border-t-transparent animate-spin"></div>
                  </div>
                )}
                {!isCheckingUsername && isUsernameAvailable && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                    <CheckCircle size={18} />
                  </div>
                )}
              </div>
              {usernameError && (
                <p className="text-red-500 text-xs mt-1 font-medium">{usernameError}</p>
              )}
            </div>
            <div className={styles.formGroup}>
              <label>{t.register.accountEmail}</label>
              <div className="relative">
                <input 
                  value={accountEmail} 
                  onChange={e => setAccountEmail(e.target.value)} 
                  type="email" 
                  placeholder={t.register.emailPlaceholder}
                  className="w-full pr-10 transition-all duration-300"
                  style={{ 
                    borderColor: emailError ? "#ef4444" : isEmailAvailable ? "#22c55e" : undefined,
                    boxShadow: emailError ? "0 0 0 1px rgba(239, 68, 68, 0.2)" : isEmailAvailable ? "0 0 0 1px rgba(34, 197, 94, 0.2)" : undefined
                  }}
                />
                {isCheckingEmail && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="h-4 w-4 rounded-full border-2 border-[hsl(var(--muted-foreground))] border-t-transparent animate-spin"></div>
                  </div>
                )}
                {!isCheckingEmail && isEmailAvailable && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                    <CheckCircle size={18} />
                  </div>
                )}
              </div>
              {emailError && (
                <p className="text-red-500 text-xs mt-1 font-medium">{emailError}</p>
              )}
            </div>
            <div className={styles.formGroup}>
              <label>{t.register.accountPassword}</label>
              
              <div className="relative">
                <input
                  value={accountPassword}
                  onChange={e => setAccountPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full pr-10 transition-all duration-300"
                  style={{ 
                    borderColor: accountPassword.length > 0 ? (isPasswordValid(accountPassword) ? "#22c55e" : "#ef4444") : undefined,
                    boxShadow: accountPassword.length > 0 ? (isPasswordValid(accountPassword) ? "0 0 0 1px rgba(34, 197, 94, 0.2)" : "0 0 0 1px rgba(239, 68, 68, 0.2)") : undefined
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Password strength indicator */}
              <div className="mt-3 flex gap-1.5">
                {[1, 2, 3, 4].map((level) => {
                  const pwStrength = [
                    accountPassword.length >= 8,
                    /[A-Z]/.test(accountPassword),
                    /\d/.test(accountPassword),
                    /[^A-Za-z0-9]/.test(accountPassword)
                  ].filter(Boolean).length;
                  
                  let bgColor = "bg-[hsl(var(--border))]";
                  if (accountPassword.length > 0 && pwStrength >= level) {
                    if (pwStrength <= 2) bgColor = "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]";
                    else if (pwStrength === 3) bgColor = "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]";
                    else bgColor = "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]";
                  }
                  
                  return (
                    <div key={level} className={`h-1.5 w-full rounded-full transition-all duration-500 ${bgColor}`}></div>
                  )
                })}
              </div>
              
              {/* Requirements badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  { label: t.auth.pwdMinLength, met: accountPassword.length >= 8 },
                  { label: t.auth.pwdUpper, met: /[A-Z]/.test(accountPassword) },
                  { label: t.auth.pwdNumber, met: /\d/.test(accountPassword) },
                  { label: t.auth.pwdSymbol, met: /[^A-Za-z0-9]/.test(accountPassword) }
                ].map((req, i) => (
                  <div key={i} className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-md border transition-all duration-300 ${
                    req.met 
                      ? "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400" 
                      : "bg-[hsl(var(--muted))] border-transparent text-[hsl(var(--muted-foreground))]"
                  }`}>
                    {req.met ? <CheckCircle className="w-3 h-3" /> : <div className="w-1.5 h-1.5 rounded-full bg-current mx-0.5" />}
                    {req.label}
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>{t.register.confirmPassword}</label>
              <div className="relative">
                <input
                  value={confirmAccountPassword}
                  onChange={e => setConfirmAccountPassword(e.target.value)}
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full pr-10 transition-all duration-300"
                  style={{ 
                    borderColor: confirmAccountPassword.length > 0 ? ((isPasswordValid(accountPassword) && accountPassword === confirmAccountPassword) ? "#22c55e" : "#ef4444") : undefined, 
                    boxShadow: confirmAccountPassword.length > 0 ? ((isPasswordValid(accountPassword) && accountPassword === confirmAccountPassword) ? "0 0 0 1px rgba(34, 197, 94, 0.2)" : "0 0 0 1px rgba(239, 68, 68, 0.2)") : undefined
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmAccountPassword.length > 0 && accountPassword !== confirmAccountPassword && (
                <p className="text-red-500 text-[11px] mt-1.5 font-medium ml-1">{t.auth.passwordsDoNotMatch}</p>
              )}
            </div>
          </div>
        )}

        {/* Step: Business Details */}
        {((!currentUser && step === 1) || (currentUser && step === 0)) && (
          <div className="space-y-4">
            <div className={styles.formGroup}>
              <label>{t.register.businessNameLabel}</label>
              <input value={name} onChange={e => setName(e.target.value)} type="text" placeholder={t.register.businessNamePlaceholder} />
            </div>
            <div className={styles.formGroup}>
              <label>{t.register.industryCategory}</label>
              <select value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORIES.filter(c => c.slug === "horeca").map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>{t.register.businessDescLabel}</label>
              <textarea
                value={shortDesc}
                onChange={e => setShortDesc(e.target.value)}
                placeholder={t.register.businessDescPlaceholder}
                rows={3}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>{t.register.foundedYearText}</label>
              <input
                value={foundedYear}
                onChange={e => {
                  const val = e.target.value;
                  if (val === "") {
                    setFoundedYear("");
                    return;
                  }
                  const numericVal = parseInt(val, 10);
                  if (!isNaN(numericVal)) {
                    if (numericVal > CURRENT_YEAR) {
                      setFoundedYear(CURRENT_YEAR.toString());
                    } else {
                      setFoundedYear(val);
                    }
                  }
                }}
                type="number"
                min="1900"
                max={CURRENT_YEAR}
                placeholder={`e.g., ${CURRENT_YEAR - 10}`}
              />
            </div>
          </div>
        )}

        {/* Step: Location & Contact */}
        {((!currentUser && step === 2) || (currentUser && step === 1)) && (
          <div className="space-y-4">
            <div className={styles.formGroup}>
              <label>{t.register.cityLabel}</label>
              <LocationSelect
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="Select Region/City/Village"
              />
            </div>
            <div className={styles.formGroup}>
              <label>{t.register.mapPicker}</label>
              <LocationPicker
                lat={lat}
                lng={lng}
                onLocationChange={(newLat, newLng, addr, extractedCity) => {
                  setLat(newLat);
                  setLng(newLng);
                  setAddress(addr.split(',').slice(0, 2).join(',').trim());
                  if (extractedCity) {
                    setCity(extractedCity);
                  }
                }}
              />
            </div>
            <div className={styles.formGroup}>
              <label>{t.register.addressDetails}</label>
              <input value={address} onChange={e => setAddress(e.target.value)} type="text" placeholder={t.register.addressPlaceholder} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={styles.formGroup}>
                <label>{t.register.contactPhone}</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-[hsl(var(--foreground))] font-medium">+374</span>
                  <input
                    value={phone}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                      setPhone(val);
                    }}
                    type="tel"
                    placeholder="XX XXXXXX"
                    style={{ paddingLeft: "3.5rem" }}
                  />
                </div>
                {phone.length > 0 && phone.length < 8 && (
                  <p className="text-xs text-red-500 mt-1.5 font-medium">
                    {phone.length === 7 ? t.register.oneDigitMissing : `${8 - phone.length} ${t.register.digitsMissing}`}
                  </p>
                )}
              </div>
              <div className={styles.formGroup}>
                <label>{t.register.contactEmailLabel}</label>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="vendor@domain.am" />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>{t.register.websiteOptional}</label>
              <input value={website} onChange={e => setWebsite(e.target.value)} type="url" placeholder="https://website.am" />
            </div>
          </div>
        )}

        {/* Step: Subscription package selection removed */}

        {/* Navigation Buttons */}
        <div className={styles.navigation}>
          <button
            type="button"
            onClick={() => {
              if (step > 0) {
                setStep(s => s - 1);
              } else {
                router.push("/signin");
              }
            }}
            className={styles.btnBack}
          >
            <ChevronLeft className="h-4 w-4" /> {t.register.back}
          </button>

          {step < stepsList.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed()}
              className={styles.btnNext}
            >
              {t.register.nextStep} <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className={`${styles.btnNext} bg-green-600 hover:bg-green-700 shadow-green-500/20`}
            >
              {loading ? t.register.registering : t.register.completeActivate}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}