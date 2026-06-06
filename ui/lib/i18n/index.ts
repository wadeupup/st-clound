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

export const translations = {
  en,
  zh,
  ja,
} as const;

export const defaultLocale: Locale = "en";

export const locales: Locale[] = ["en", "zh", "ja"];

export const getAcceptLanguageFromLocale = (locale?: string) => {
  if (!locale) return ACCEPT_LANGUAGE_BY_LOCALE[defaultLocale];
  return (
    ACCEPT_LANGUAGE_BY_LOCALE[
      locale as keyof typeof ACCEPT_LANGUAGE_BY_LOCALE
    ] ?? ACCEPT_LANGUAGE_BY_LOCALE[defaultLocale]
  );
};

