"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  defaultLocale,
  getHtmlLangFromLocale,
  isLocale,
  Locale,
  LOCALE_STORAGE_KEY,
  Translations,
  translations,
} from "./index";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

const getLocaleFromCookie = (): Locale | undefined => {
  if (typeof document === "undefined") return undefined;

  const localeCookie = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${LOCALE_STORAGE_KEY}=`));
  const locale = localeCookie?.split("=")[1];

  return isLocale(locale) ? locale : undefined;
};

const getStoredLocale = (): Locale => {
  if (typeof window === "undefined") return defaultLocale;

  const localStorageLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (isLocale(localStorageLocale)) return localStorageLocale;

  return getLocaleFromCookie() ?? defaultLocale;
};

const persistLocale = (locale: Locale) => {
  if (typeof window === "undefined") return;

  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  document.cookie = `${LOCALE_STORAGE_KEY}=${locale}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
  document.documentElement.lang = getHtmlLangFromLocale(locale);
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => getStoredLocale());

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    persistLocale(newLocale);
  };

  useEffect(() => {
    const storedLocale = getStoredLocale();
    setLocaleState(storedLocale);
    persistLocale(storedLocale);
  }, []);

  const value: I18nContextType = {
    locale,
    setLocale,
    t: translations[locale] as Translations,
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
