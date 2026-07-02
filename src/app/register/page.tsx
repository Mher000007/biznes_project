"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { CATEGORIES, ARMENIAN_CITIES } from "@/lib/constants";
import { saveBusinessProfile } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import { Building2, CheckCircle, ChevronRight, ChevronLeft, ShieldCheck, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { getApiUrl } from "@/lib/utils";
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
  const { currentUser, register: authRegister } = useAuth();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Dynamic steps setup
  const stepsList = currentUser 
    ? ["Business Details", "Contact & Address"]
    : ["Account Setup", "Business Details", "Contact & Address"];

  // Step 0 (if !currentUser) - Account setup credentials
  const [accountUsername, setAccountUsername] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountPassword, setAccountPassword] = useState("");

  // Business Details fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
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
  const canProceed = () => {
    if (!currentUser) {
      switch (step) {
        case 0: return accountUsername && accountEmail && accountPassword.length >= 6;
        case 1: return name && category && shortDesc;
        case 2: return city && phone && email;
        default: return true;
      }
    } else {
      switch (step) {
        case 0: return name && category && shortDesc;
        case 1: return city && phone && email;
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
          accountType: "business"
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
      const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
      const apiURL = getApiUrl();
      
      const payload = {
        name,
        description: shortDesc,
        category: selectedCategoryObject?.id || category,
        email,
        phone,
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

      const response = await axios.post(`${apiURL}/businesses/onboard`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

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
      phone,
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
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="pt-20 pb-16">
        <div className="mx-auto max-w-lg px-4 text-center py-20">
          <div className="flex justify-center mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold mb-3">Onboarding Complete!</h1>
          <p className="text-[hsl(var(--muted-foreground))] mb-8 leading-relaxed">
            Your brand profile and user credentials have been registered. You can now sign in at any time to modify details.
          </p>
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 text-left space-y-3.5 shadow-md">
            <div className="flex justify-between border-b border-[hsl(var(--border))] pb-2"><span className="text-[hsl(var(--muted-foreground))]">Business Name</span><span className="font-semibold">{name}</span></div>
            <div className="flex justify-between border-b border-[hsl(var(--border))] pb-2"><span className="text-[hsl(var(--muted-foreground))]">Username Login</span><span className="font-semibold text-blue-600">{currentUser?.username || accountUsername}</span></div>
            <div className="flex justify-between"><span className="text-[hsl(var(--muted-foreground))]">Status</span><span className="inline-flex items-center gap-1 font-bold text-amber-500"><Star className="h-3 w-3 fill-amber-500 animate-spin" /> Pending Approval</span></div>
          </div>
          <div className="mt-8">
            <Link href="/dashboard" className="btn-primary px-6 py-3 rounded-xl text-sm font-semibold">
              Go to Vendor Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.iconWrapper}>
          <Building2 className="h-6 w-6" />
        </div>
        <h1>Partner Onboarding</h1>
        <p>Complete 4 simple steps to list your brand in the Armenian Business Directory</p>
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
              <label>Select Username Login *</label>
              <input value={accountUsername} onChange={e => setAccountUsername(e.target.value)} type="text" placeholder="e.g. aram_petrosyan" />
            </div>
            <div className={styles.formGroup}>
              <label>Account Email address *</label>
              <input value={accountEmail} onChange={e => setAccountEmail(e.target.value)} type="email" placeholder="aram@domain.am" />
            </div>
            <div className={styles.formGroup}>
              <label>Account Password * (Min. 6 characters)</label>
              <input value={accountPassword} onChange={e => setAccountPassword(e.target.value)} type="password" placeholder="••••••••" />
            </div>
          </div>
        )}

        {/* Step: Business Details */}
        {((!currentUser && step === 1) || (currentUser && step === 0)) && (
          <div className="space-y-4">
            <div className={styles.formGroup}>
              <label>Business Name / Brand *</label>
              <input value={name} onChange={e => setName(e.target.value)} type="text" placeholder="e.g. Lavash Restaurant, Grand Auto Service" />
            </div>
            <div className={styles.formGroup}>
              <label>Industry Category *</label>
              <select value={category} onChange={e => setCategory(e.target.value)}>
                <option value="">Select industry category</option>
                {CATEGORIES.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Business Description / Summary *</label>
              <textarea
                value={shortDesc}
                onChange={e => setShortDesc(e.target.value)}
                placeholder="Describe what your business does, key products/services, etc. (required)"
                rows={3}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Founded Year</label>
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
              <label>City *</label>
              <select value={city} onChange={e => setCity(e.target.value)}>
                <option value="">Select Armenian City</option>
                {ARMENIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Interactive Map Location Picker</label>
              <LocationPicker
                lat={lat}
                lng={lng}
                onLocationChange={(newLat, newLng, addr) => {
                  setLat(newLat);
                  setLng(newLng);
                  setAddress(addr.split(',').slice(0, 2).join(',').trim());
                }}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Address details</label>
              <input value={address} onChange={e => setAddress(e.target.value)} type="text" placeholder="Address resolved from map or custom details" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={styles.formGroup}>
                <label>Contact Phone *</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" placeholder="+374 XX XXXXXX" />
              </div>
              <div className={styles.formGroup}>
                <label>Contact Email *</label>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="vendor@domain.am" />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Website link (optional)</label>
              <input value={website} onChange={e => setWebsite(e.target.value)} type="url" placeholder="https://website.am" />
            </div>
          </div>
        )}

        {/* Step: Subscription package selection removed */}

        {/* Navigation Buttons */}
        <div className={styles.navigation}>
          <button
            type="button"
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className={styles.btnBack}
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>

          {step < stepsList.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed()}
              className={styles.btnNext}
            >
              Next Step <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className={`${styles.btnNext} bg-green-600 hover:bg-green-700 shadow-green-500/20`}
            >
              {loading ? "Registering..." : "Complete & Activate Listing"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}