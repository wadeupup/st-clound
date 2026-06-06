"use client";
import { useI18n } from "@/lib/i18n/context";

export const UsersTitle = () => {
  const { t } = useI18n();
  return <>{t.users.title}</>;
};

