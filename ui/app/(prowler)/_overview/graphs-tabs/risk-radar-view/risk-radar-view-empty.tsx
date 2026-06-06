"use client";

import { Info } from "lucide-react";

import { useI18n } from "@/lib/i18n/context";

export function RiskRadarViewEmpty() {
  const { t } = useI18n();

  return (
    <div className="flex h-[460px] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-center">
        <Info size={48} className="text-slate-600 dark:text-slate-400" />
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          {t.overview.graphsTabs.noCategoryData}
        </p>
      </div>
    </div>
  );
}

