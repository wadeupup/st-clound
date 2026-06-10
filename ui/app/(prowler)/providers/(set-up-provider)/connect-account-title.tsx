"use client";
import { useI18n } from "@/lib/i18n/context";

export const ConnectAccountTitle = () => {
  const { t } = useI18n();
  return <>{t.providers.connectAccount.title}</>;
};
