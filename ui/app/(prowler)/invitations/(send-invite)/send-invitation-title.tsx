"use client";
import { useI18n } from "@/lib/i18n/context";

export const SendInvitationTitle = () => {
  const { t } = useI18n();
  return <>{t.invitations.sendInvitation.title}</>;
};

