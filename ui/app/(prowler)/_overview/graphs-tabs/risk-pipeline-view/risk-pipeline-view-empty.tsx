"use client";

import { useI18n } from "@/lib/i18n/context";

interface RiskPipelineViewEmptyProps {
  message: "noFindingsData" | "noFailedFindings";
  className?: string;
}

export function RiskPipelineViewEmpty({
  message,
  className = "",
}: RiskPipelineViewEmptyProps) {
  const { t } = useI18n();

  const messageText =
    message === "noFindingsData"
      ? t.overview.graphsTabs.noFindingsData
      : t.overview.graphsTabs.noFailedFindings;

  if (className) {
    return <span className={className}>{messageText}</span>;
  }

  return (
    <div className="flex h-[460px] w-full items-center justify-center">
      <p className="text-slate-600 dark:text-slate-400 text-sm">{messageText}</p>
    </div>
  );
}

