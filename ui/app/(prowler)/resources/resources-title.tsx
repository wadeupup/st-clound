"use client";
import { useI18n } from "@/lib/i18n/context";

export const ResourcesTitle = () => {
  const { t } = useI18n();
  return <>{t.resources.title}</>;
};

