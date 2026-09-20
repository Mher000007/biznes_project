/**
 * Safe localStorage utilities with automatic QuotaExceededError recovery and cleanup.
 */

export function safeGetLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const item = window.localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (err) {
    console.warn(`Failed to read/parse localStorage key "${key}":`, err);
    return fallback;
  }
}

/**
 * Clean bloated entries or oversized data URLs from localStorage if quota is reached.
 */
export function cleanLocalStorage(): void {
  if (typeof window === "undefined") return;

  try {
    // 1. Remove temporary mock tracking / debug keys
    const nonEssentialKeys = [
      "armbiz-mock-views",
      "armbiz-mock-inquiries",
      "armbiz_hidden_bookings",
    ];
    for (const k of nonEssentialKeys) {
      try {
        window.localStorage.removeItem(k);
      } catch {
        // ignore
      }
    }

    // 2. Sanitize armbiz-business-profiles if present
    const profilesRaw = window.localStorage.getItem("armbiz-business-profiles");
    if (profilesRaw) {
      try {
        const profiles = JSON.parse(profilesRaw);
        if (Array.isArray(profiles)) {
          // Prune older or bloated profiles: limit gallery items, strip huge base64 data
          const sanitizedProfiles = profiles.slice(-8).map((p: any) => ({
            ...p,
            gallery: Array.isArray(p.gallery) ? p.gallery.slice(0, 4) : [],
            stories: Array.isArray(p.stories) ? p.stories.slice(0, 3) : [],
            highlights: Array.isArray(p.highlights) ? p.highlights.slice(0, 3) : [],
          }));
          window.localStorage.setItem("armbiz-business-profiles", JSON.stringify(sanitizedProfiles));
        }
      } catch (err) {
        console.warn("Failed to sanitize armbiz-business-profiles:", err);
      }
    }
  } catch (err) {
    console.warn("Error during localStorage cleanup:", err);
  }
}

/**
 * Safely writes to localStorage, handling QuotaExceededError gracefully.
 */
export function safeSetLocalStorage(key: string, value: string): boolean {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (err: any) {
    // Check if error is QuotaExceededError
    const isQuota =
      err?.name === "QuotaExceededError" ||
      err?.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      err?.code === 22 ||
      err?.code === 1014;

    if (isQuota) {
      console.warn(`LocalStorage quota exceeded while setting "${key}". Attempting cleanup...`);
      try {
        cleanLocalStorage();
        window.localStorage.setItem(key, value);
        return true;
      } catch (retryErr: any) {
        console.warn(`LocalStorage write retry failed for "${key}":`, retryErr);

        // If key is armbiz-business-profiles, try saving a sanitized lightweight version
        if (key === "armbiz-business-profiles") {
          try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
              const lightweight = parsed.map((p: any) => ({
                ...p,
                gallery: [],
                stories: [],
                highlights: [],
                coverUrl: Array.isArray(p.coverUrl) ? p.coverUrl.slice(0, 1) : p.coverUrl,
              }));
              window.localStorage.setItem(key, JSON.stringify(lightweight));
              return true;
            }
          } catch {
            // ignore
          }
        }
      }
    } else {
      console.warn(`Error setting localStorage key "${key}":`, err);
    }
    return false;
  }
}
