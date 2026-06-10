"use client";

import { Languages } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/shadcn/select/select";
import { useI18n } from "@/lib/i18n/context";
import { Locale, locales } from "@/lib/i18n/index";

const localeLabels: Record<Locale, string> = {
  en: "English",
  zh: "中文",
  ja: "日本語",
};

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <Select
      value={locale}
      onValueChange={(value) => {
        const nextLocale = value as Locale;

        if (nextLocale === locale) return;

        setLocale(nextLocale);
        window.location.reload();
      }}
    >
      <SelectTrigger className="h-9 w-9 rounded-full border-slate-300 bg-white/50 p-0 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:bg-slate-800 [&>svg:last-child]:hidden">
        <div className="flex h-full w-full items-center justify-center">
          <Languages className="h-4 w-4 text-slate-600 dark:text-slate-400" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {locales.map((loc) => (
          <SelectItem key={loc} value={loc}>
            {localeLabels[loc]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
