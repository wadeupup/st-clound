import { en } from "./locales/en";
import { ja } from "./locales/ja";
import { zh } from "./locales/zh";

export type Locale = "en" | "zh" | "ja";

export type Translations = typeof en;

export const LOCALE_STORAGE_KEY = "app-locale";

const ACCEPT_LANGUAGE_BY_LOCALE = {
  en: "en",
  zh: "zh-CN",
  ja: "ja-JP",
} as const;

const HTML_LANG_BY_LOCALE = {
  en: "en",
  zh: "zh-CN",
  ja: "ja-JP",
} as const;

export const translations = {
  en,
  zh,
  ja,
} as const;

export const defaultLocale: Locale = "en";

export const locales: Locale[] = ["en", "zh", "ja"];

export const isLocale = (locale?: string | null): locale is Locale =>
  !!locale && locales.includes(locale as Locale);

export const normalizeLocale = (locale?: string | null): Locale =>
  isLocale(locale) ? locale : defaultLocale;

export const getAcceptLanguageFromLocale = (locale?: string | null) => {
  const normalizedLocale = normalizeLocale(locale);

  return (
    ACCEPT_LANGUAGE_BY_LOCALE[normalizedLocale] ??
    ACCEPT_LANGUAGE_BY_LOCALE[defaultLocale]
  );
};

export const getHtmlLangFromLocale = (locale?: string | null) => {
  const normalizedLocale = normalizeLocale(locale);

  return HTML_LANG_BY_LOCALE[normalizedLocale] ?? HTML_LANG_BY_LOCALE.en;
};
