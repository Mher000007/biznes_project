export type AccountType = "personal" | "business";

export interface UserAccount {
  username: string;
  displayName: string;
  email: string;
  password: string;
  accountType: AccountType;
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

const USERS_KEY = "armbiz-users";
const CURRENT_USER_KEY = "armbiz-current-user";
const BUSINESS_PROFILES_KEY = "armbiz-business-profiles";

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function getUsers(): UserAccount[] {
  if (typeof window === "undefined") return [];
  return safeParse<UserAccount[]>(window.localStorage.getItem(USERS_KEY), []);
}

export function setUsers(users: UserAccount[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getCurrentUser(): UserAccount | null {
  if (typeof window === "undefined") return null;
  return safeParse<UserAccount | null>(window.localStorage.getItem(CURRENT_USER_KEY), null);
}

export function setCurrentUser(user: UserAccount | null) {
  if (typeof window === "undefined") return;
  if (user) {
    window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(CURRENT_USER_KEY);
  }
}

export function signOut() {
  setCurrentUser(null);
}

export function registerUser(input: {
  username: string;
  displayName: string;
  email: string;
  password: string;
  accountType: AccountType;
}): { success: boolean; error?: string; user?: UserAccount } {
  if (typeof window === "undefined") {
    return { success: false, error: "Client-only auth is not available." };
  }

  const users = getUsers();
  const normalizedUsername = input.username.trim().toLowerCase();
  const normalizedEmail = input.email.trim().toLowerCase();

  if (!normalizedUsername || !normalizedEmail || !input.password) {
    return { success: false, error: "Please enter username, email, and password." };
  }

  const exists = users.some(
    (user) => user.username.toLowerCase() === normalizedUsername || user.email.toLowerCase() === normalizedEmail
  );
  if (exists) {
    return { success: false, error: "An account with that username or email already exists." };
  }

  const user: UserAccount = {
    username: normalizedUsername,
    displayName: input.displayName.trim() || normalizedUsername,
    email: normalizedEmail,
    password: input.password,
    accountType: input.accountType,
    createdAt: new Date().toISOString(),
  };

  setUsers([...users, user]);
  setCurrentUser(user);
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

  const profiles = safeParse<BusinessProfile[]>(window.localStorage.getItem(BUSINESS_PROFILES_KEY), []);
  const nextProfile: BusinessProfile = {
    ...profile,
    createdAt: new Date().toISOString(),
  };
  const updated = profiles.filter((item) => item.ownerUsername !== profile.ownerUsername);
  updated.push(nextProfile);
  window.localStorage.setItem(BUSINESS_PROFILES_KEY, JSON.stringify(updated));
  return { success: true, profile: nextProfile };
}

export function getBusinessProfile(ownerUsername: string): BusinessProfile | null {
  if (typeof window === "undefined") {
    return null;
  }

  const profiles = safeParse<BusinessProfile[]>(window.localStorage.getItem(BUSINESS_PROFILES_KEY), []);
  return profiles.find((profile) => profile.ownerUsername === ownerUsername) ?? null;
}

export function deleteBusinessProfile(ownerUsername: string): { success: boolean } {
  if (typeof window === "undefined") {
    return { success: false };
  }

  const profiles = safeParse<BusinessProfile[]>(window.localStorage.getItem(BUSINESS_PROFILES_KEY), []);
  const updated = profiles.filter((item) => item.ownerUsername !== ownerUsername);
  window.localStorage.setItem(BUSINESS_PROFILES_KEY, JSON.stringify(updated));
  return { success: true };
}
