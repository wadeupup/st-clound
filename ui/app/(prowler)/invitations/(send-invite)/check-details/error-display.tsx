"use client";
import { useI18n } from "@/lib/i18n/context";

export const ErrorDisplay = ({ type }: { type: "invalidId" | "notFound" }) => {
  const { t } = useI18n();
  const message =
    type === "invalidId"
      ? t.invitations.checkDetails.invalidId
      : t.invitations.checkDetails.notFound;
  return <div>{message}</div>;
};
