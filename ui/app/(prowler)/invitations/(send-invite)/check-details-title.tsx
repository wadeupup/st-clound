"use client";
import { useI18n } from "@/lib/i18n/context";

export const CheckDetailsTitle = () => {
  const { t } = useI18n();
  return <>{t.invitations.checkDetails.title}</>;
};

