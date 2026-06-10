"use client";

import { CustomBanner } from "@/components/ui/custom/custom-banner";
import { useI18n } from "@/lib/i18n/context";

export function AccessDeniedBanner() {
  const { t } = useI18n();
  return (
    <CustomBanner
      title={t.scans.accessDenied}
      message={t.scans.noPermissionToLaunch}
    />
  );
}
