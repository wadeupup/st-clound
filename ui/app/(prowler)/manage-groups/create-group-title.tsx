"use client";

import { useI18n } from "@/lib/i18n/context";

export function CreateGroupTitle() {
  const { t } = useI18n();
  return (
    <>
      <h1 className="mb-2 text-xl font-medium" id="getting-started">
        {t.providers.providerGroups.createNewGroup}
      </h1>
      <p className="text-small text-default-500 mb-5">
        {t.providers.providerGroups.createNewGroupDescription}
      </p>
    </>
  );
}

