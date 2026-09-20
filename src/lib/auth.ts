export type AccountType = "personal" | "business";

export interface User {
  id: string;
  name: string;
  username?: string;
  email: string;
  accountType: AccountType;
  role: string;
  verified: boolean;
  phone?: string;
  treeoCoins?: number;
  redeemedInviteCode?: string;
  avatar?: string;
  locale?: "hy" | "en" | "ru";
}

export interface UserAccount {
  username: string;
  displayName: string;
  email: string;
  password: string;
  accountType: AccountType;
  treeoCoins?: number;
  redeemedInviteCode?: string;
  createdAt: string;
}

export interface BusinessProfile {
  ownerUsername: string;
  businessName: string;
  category: string;
  shortDesc: string;
  fullDesc: string;
  foundedYear: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  services: Array<{ name: string; description: string; price: string; duration: string }>;
  operatingHours: Array<{ day: string; open: string; close: string; closed: boolean }>;
  instagram: string;
  facebook: string;
  telegram: string;
  linkedin: string;
  tags: string;
  createdAt: string;
}

const USERS_KEY = "armbiz_users";
const CURRENT_USER_KEY = "armbiz_current_user";
const BUSINESS_PROFILES_KEY = "armbiz-business-profiles";

function safeParse<T>(jsonString: string | null, fallback: T): T {
  if (!jsonString) return fallback;
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return fallback;
  }
}

import { safeSetLocalStorage, safeGetLocalStorage } from "./storage";

export function getUsers(): UserAccount[] {
  if (typeof window === "undefined") return [];
  return safeGetLocalStorage<UserAccount[]>(USERS_KEY, []);
}

export function setUsers(users: UserAccount[]): void {
  if (typeof window === "undefined") return;
  safeSetLocalStorage(USERS_KEY, JSON.stringify(users));
}

export function getCurrentUser(): UserAccount | null {
  if (typeof window === "undefined") return null;
  return safeGetLocalStorage<UserAccount | null>(CURRENT_USER_KEY, null);
}

export function setCurrentUser(user: UserAccount | null): void {
  if (typeof window === "undefined") return;
  if (!user) {
    try {
      window.localStorage.removeItem(CURRENT_USER_KEY);
    } catch {
      // ignore
    }
    return;
  }
  safeSetLocalStorage(CURRENT_USER_KEY, JSON.stringify(user));
}

export function signOut() {
  setCurrentUser(null);
}

export function createAccount(input: {
  username: string;
  displayName: string;
  email: string;
  password: string;
  accountType: AccountType;
  inviteCode?: string;
}): { success: boolean; error?: string; user?: UserAccount } {
  if (typeof window === "undefined") {
    return { success: false, error: "Client-only auth is not available." };
  }

  const users = getUsers();
  const normalizedUsername = input.username.trim().toLowerCase();
  const normalizedEmail = input.email.trim().toLowerCase();
  const normalizedDisplayName = input.displayName.trim().toLowerCase();

  if (!normalizedUsername || !normalizedEmail || !input.password) {
    return { success: false, error: "Please enter username, email, and password." };
  }

  if (users.some((user) => user.username.toLowerCase() === normalizedUsername)) {
    return { success: false, error: "Այս Օգտանունը (Username) արդեն զբաղված է: / That Username is already taken." };
  }

  if (normalizedDisplayName && users.some((user) => user.displayName && user.displayName.toLowerCase() === normalizedDisplayName)) {
    return { success: false, error: "Այս Անունը (Name) արդեն զբաղված է: / That Name is already taken." };
  }

  if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
    return { success: false, error: "Այս էլ. հասցեով (Email) հաշիվ արդեն գոյություն ունի: / An account with that Email already exists." };
  }

  let initialCoins = 0;
  let redeemedCode = "";
  if (input.inviteCode && input.inviteCode.trim()) {
    const cleanInvite = input.inviteCode.trim();
    const cleanInviteLower = cleanInvite.toLowerCase();
    const inviterIndex = users.findIndex((u) => u.username.toLowerCase() === cleanInviteLower || (u.displayName && u.displayName.toLowerCase() === cleanInviteLower));
    
    initialCoins = 100;
    redeemedCode = cleanInvite;

    if (inviterIndex !== -1) {
      users[inviterIndex] = {
        ...users[inviterIndex],
        treeoCoins: (users[inviterIndex].treeoCoins || 0) + 100
      };
    }
  }

  const user: UserAccount = {
    username: normalizedUsername,
    displayName: input.displayName.trim() || normalizedUsername,
    email: normalizedEmail,
    password: input.password,
    accountType: input.accountType,
    treeoCoins: initialCoins,
    redeemedInviteCode: redeemedCode,
    createdAt: new Date().toISOString(),
  };

  setUsers([...users, user]);
  setCurrentUser(user);

  if (redeemedCode) {
    const uKey = normalizedUsername || normalizedEmail;
    if (uKey) {
      safeSetLocalStorage(`armbiz_redeemed_code_${uKey}`, redeemedCode);
      safeSetLocalStorage(`armbiz_user_coins_${uKey}`, String(initialCoins));
    }
  }

  return { success: true, user };
}

export function signIn(input: { userOrEmail: string; password: string }): { success: boolean; error?: string; user?: UserAccount } {
  if (typeof window === "undefined") {
    return { success: false, error: "Client-only auth is not available." };
  }

  const users = getUsers();
  const identifier = input.userOrEmail.trim().toLowerCase();
  const user = users.find(
    (item) => item.username.toLowerCase() === identifier || item.email.toLowerCase() === identifier
  );

  if (!user) {
    return { success: false, error: "No account was found with that username or email." };
  }

  if (user.password !== input.password) {
    return { success: false, error: "Invalid password. Please try again." };
  }

  setCurrentUser(user);
  return { success: true, user };
}

export function resetPassword(input: { userOrEmail: string; newPassword: string }): { success: boolean; error?: string } {
  if (typeof window === "undefined") {
    return { success: false, error: "Client-only auth is not available." };
  }

  const users = getUsers();
  const identifier = input.userOrEmail.trim().toLowerCase();
  const index = users.findIndex(
    (item) => item.username.toLowerCase() === identifier || item.email.toLowerCase() === identifier
  );

  if (index === -1) {
    return { success: false, error: "No account was found with that username or email." };
  }

  if (!input.newPassword) {
    return { success: false, error: "Please provide a new password." };
  }

  users[index] = { ...users[index], password: input.newPassword };
  setUsers(users);
  if (getCurrentUser()?.username.toLowerCase() === users[index].username.toLowerCase()) {
    setCurrentUser(users[index]);
  }

  return { success: true };
}

export function saveBusinessProfile(profile: Omit<BusinessProfile, "createdAt">) {
  if (typeof window === "undefined") {
    return { success: false, error: "Client-only auth is not available." };
  }

  const nextProfile: BusinessProfile = {
    ...profile,
    createdAt: new Date().toISOString(),
  };

  try {
    const profiles = safeGetLocalStorage<BusinessProfile[]>(BUSINESS_PROFILES_KEY, []);
    const updated = profiles.filter((item) => item.ownerUsername !== profile.ownerUsername);

    // Keep profile storage optimized to prevent localStorage overflow
    const storageProfile = {
      ...nextProfile,
      gallery: Array.isArray((nextProfile as any).gallery)
        ? (nextProfile as any).gallery.slice(0, 8)
        : (nextProfile as any).gallery,
      stories: Array.isArray((nextProfile as any).stories)
        ? (nextProfile as any).stories.slice(0, 6)
        : (nextProfile as any).stories,
    };

    updated.push(storageProfile as BusinessProfile);
    safeSetLocalStorage(BUSINESS_PROFILES_KEY, JSON.stringify(updated));
    return { success: true, profile: nextProfile };
  } catch (err) {
    console.warn("Could not synchronize business profile to localStorage:", err);
    return { success: true, profile: nextProfile };
  }
}

export function getBusinessProfile(ownerUsername: string): BusinessProfile | null {
  if (typeof window === "undefined") {
    return null;
  }

  const profiles = safeGetLocalStorage<BusinessProfile[]>(BUSINESS_PROFILES_KEY, []);
  return profiles.find((profile) => profile.ownerUsername === ownerUsername) ?? null;
}

export function deleteBusinessProfile(ownerUsername: string): { success: boolean } {
  if (typeof window === "undefined") {
    return { success: false };
  }

  try {
    const profiles = safeGetLocalStorage<BusinessProfile[]>(BUSINESS_PROFILES_KEY, []);
    const updated = profiles.filter((item) => item.ownerUsername !== ownerUsername);
    safeSetLocalStorage(BUSINESS_PROFILES_KEY, JSON.stringify(updated));
    return { success: true };
  } catch (err) {
    console.warn("Could not delete business profile from localStorage:", err);
    return { success: false };
  }
}

