"use client";

import { useI18n } from "@/lib/i18n/context";
import { CustomBanner } from "@/components/ui/custom/custom-banner";

export function AccessDeniedBanner() {
  const { t } = useI18n();
  return (
    <CustomBanner
      title={t.scans.accessDenied}
      message={t.scans.noPermissionToLaunch}
    />
  );
}

