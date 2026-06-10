"use client";
import { useI18n } from "@/lib/i18n/context";

export const RolesTitle = () => {
  const { t } = useI18n();
  return <>{t.roles.title}</>;
};
