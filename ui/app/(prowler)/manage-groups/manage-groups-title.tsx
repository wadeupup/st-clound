"use client";

import { useI18n } from "@/lib/i18n/context";

export function ManageGroupsTitle() {
  const { t } = useI18n();
  return <>{t.providers.providerGroups.manageGroups}</>;
}
