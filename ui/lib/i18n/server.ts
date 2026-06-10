import "server-only";

import { cookies } from "next/headers";

import {
  getAcceptLanguageFromLocale,
  getHtmlLangFromLocale,
  type Locale,
  LOCALE_STORAGE_KEY,
  normalizeLocale,
} from "./index";

export const getRequestLocale = async (): Promise<Locale> => {
  const cookieStore = await cookies();
  return normalizeLocale(cookieStore.get(LOCALE_STORAGE_KEY)?.value);
};

export const getRequestAcceptLanguage = async () =>
  getAcceptLanguageFromLocale(await getRequestLocale());

export const getRequestHtmlLang = async () =>
  getHtmlLangFromLocale(await getRequestLocale());
