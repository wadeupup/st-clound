"use client";

import { Info } from "lucide-react";

import { useI18n } from "@/lib/i18n/context";

interface RiskPlotEmptyProps {
  message: "noProviders" | "noRiskData";
  providersWithoutDataCount?: number;
}

export function RiskPlotEmpty({
  message,
  providersWithoutDataCount,
}: RiskPlotEmptyProps) {
  const { t } = useI18n();

  const messageText =
    message === "noProviders"
      ? t.overview.graphsTabs.noProvidersAvailable
      : t.overview.graphsTabs.noRiskData;

  return (
    <div className="flex h-[460px] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-center">
        <Info size={48} className="text-slate-600 dark:text-slate-400" />
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {messageText}
        </p>
        {providersWithoutDataCount !== undefined &&
          providersWithoutDataCount > 0 && (
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {t.overview.graphsTabs.providersNoScans.replace(
                "{count}",
                String(providersWithoutDataCount),
              )}
            </p>
          )}
      </div>
    </div>
  );
}
