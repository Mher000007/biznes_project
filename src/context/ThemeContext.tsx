"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("findy_theme") as Theme | null;
    if (saved) {
      setThemeState(saved);
    }
    setMounted(true);
  }, []);

  const applyTheme = (currentTheme: Theme) => {
    const root = document.documentElement;
    if (currentTheme === "dark") {
      root.classList.add("dark");
    } else if (currentTheme === "light") {
      root.classList.remove("dark");
    } else {
      // Time-based auto: 17:00 to 08:00 is dark, else light
      const hour = new Date().getHours();
      if (hour >= 17 || hour < 8) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("findy_theme", newTheme);
    applyTheme(newTheme);
  };

  useEffect(() => {
    if (!mounted) return;
    
    applyTheme(theme);

    let interval: NodeJS.Timeout;
    if (theme === "system") {
      // Check every minute if the time crossed the threshold
      interval = setInterval(() => {
        applyTheme("system");
      }, 60000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [theme, mounted]);

  // Prevent rendering children until mounted to avoid hydration mismatch if theme affects rendering
  // But wait, if we return null, it breaks SEO. We should just return children.
  // The script in layout.tsx will handle the initial HTML class.
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
