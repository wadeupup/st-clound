"use client";

import { useI18n } from "@/lib/i18n/context";

export function ManageGroupsPageClient() {
  const { t } = useI18n();
  return (
    <>
      <h3 className="mb-4 text-sm font-bold uppercase">
        {t.providers.providerGroups.title}
      </h3>
    </>
  );
}

