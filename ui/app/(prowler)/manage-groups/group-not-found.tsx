"use client";

import { useI18n } from "@/lib/i18n/context";

export function GroupNotFound() {
  const { t } = useI18n();
  return (
    <p className="text-small text-default-500 mb-5">
      {t.providers.providerGroups.groupNotFound}
    </p>
  );
}
