"use client";
import { useI18n } from "@/lib/i18n/context";

export const ProvidersTitle = () => {
  const { t } = useI18n();
  return <>{t.providers.title}</>;
};

