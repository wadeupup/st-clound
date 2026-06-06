"use client";

import { LineDataPoint } from "@/components/graphs/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn";
import { useI18n } from "@/lib/i18n/context";

import { FindingSeverityOverTime } from "./finding-severity-over-time";

interface FindingSeverityOverTimeCardProps {
  data: LineDataPoint[];
}

export function FindingSeverityOverTimeCard({
  data,
}: FindingSeverityOverTimeCardProps) {
  const { t } = useI18n();

  return (
    <Card variant="base" className="flex h-full flex-1 flex-col">
      <CardHeader className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <CardTitle>{t.overview.severityOverTime.title}</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col px-6">
        <FindingSeverityOverTime data={data} />
      </CardContent>
    </Card>
  );
}

