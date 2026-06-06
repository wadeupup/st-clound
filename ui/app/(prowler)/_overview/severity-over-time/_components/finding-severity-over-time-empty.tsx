"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn";
import { useI18n } from "@/lib/i18n/context";

interface FindingSeverityOverTimeEmptyProps {
  message: "noDataAvailable" | "failedToLoadData";
}

export function FindingSeverityOverTimeEmpty({
  message,
}: FindingSeverityOverTimeEmptyProps) {
  const { t } = useI18n();

  const messageText =
    message === "noDataAvailable"
      ? t.overview.severityOverTime.noDataAvailable
      : t.overview.severityOverTime.failedToLoadData;

  return (
    <Card variant="base" className="flex h-full min-h-[405px] flex-1 flex-col">
      <CardHeader className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <CardTitle>{t.overview.severityOverTime.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 items-center justify-center">
        <p className="text-slate-600 dark:text-slate-400">{messageText}</p>
      </CardContent>
    </Card>
  );
}

