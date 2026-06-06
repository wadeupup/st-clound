"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  Locale,
  Translations,
  translations,
  defaultLocale,
  LOCALE_STORAGE_KEY,
} from "./index";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return defaultLocale;
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    return (stored as Locale) || defaultLocale;
  });

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
      document.cookie = `${LOCALE_STORAGE_KEY}=${newLocale}; Path=/; SameSite=Lax`;
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (stored && (stored === "en" || stored === "zh" || stored === "ja")) {
        setLocaleState(stored as Locale);
        document.cookie = `${LOCALE_STORAGE_KEY}=${stored}; Path=/; SameSite=Lax`;
      }
    }
  }, []);

  const value: I18nContextType = {
    locale,
    setLocale,
    t: translations[locale],
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

