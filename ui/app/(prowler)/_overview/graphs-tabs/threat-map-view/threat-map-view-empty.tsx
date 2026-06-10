"use client";

import { useI18n } from "@/lib/i18n/context";

export function ThreatMapViewEmpty() {
  const { t } = useI18n();

  return (
    <div className="flex h-[460px] w-full items-center justify-center">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        {t.overview.graphsTabs.noRegionData}
      </p>
    </div>
  );
}
