"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { HorizontalBarChart } from "@/components/graphs/horizontal-bar-chart";
import { BarDataPoint } from "@/components/graphs/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn";
import { useI18n } from "@/lib/i18n/context";
import { mapProviderFiltersForFindings } from "@/lib/provider-helpers";
import { calculatePercentage } from "@/lib/utils";
import { SeverityLevel } from "@/types/severities";

interface RiskSeverityChartProps {
  critical: number;
  high: number;
  medium: number;
  low: number;
  informational: number;
}

export const RiskSeverityChart = ({
  critical,
  high,
  medium,
  low,
  informational,
}: RiskSeverityChartProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();

  const handleBarClick = (dataPoint: BarDataPoint) => {
    // Build the URL with current filters plus severity and muted
    const params = new URLSearchParams(searchParams.toString());

    mapProviderFiltersForFindings(params);

    // Map translated name to severity level
    const severity = severityNameMap[dataPoint.name];
    if (severity) {
      params.set("filter[severity__in]", severity);
    }

    // Add exclude muted findings filter
    params.set("filter[muted]", "false");

    // Filter by FAIL findings
    params.set("filter[status__in]", "FAIL");

    // Navigate to findings page
    router.push(`/findings?${params.toString()}`);
  };
  // Calculate total findings
  const totalFindings = critical + high + medium + low + informational;

  // Create a mapping from translated names to severity levels
  const severityNameMap: Record<string, SeverityLevel> = {
    [t.overview.riskSeverity.critical]: "critical",
    [t.overview.riskSeverity.high]: "high",
    [t.overview.riskSeverity.medium]: "medium",
    [t.overview.riskSeverity.low]: "low",
    [t.overview.riskSeverity.info]: "informational",
  };

  // Transform data to BarDataPoint format
  const chartData: BarDataPoint[] = [
    {
      name: t.overview.riskSeverity.critical,
      value: critical,
      percentage: calculatePercentage(critical, totalFindings),
    },
    {
      name: t.overview.riskSeverity.high,
      value: high,
      percentage: calculatePercentage(high, totalFindings),
    },
    {
      name: t.overview.riskSeverity.medium,
      value: medium,
      percentage: calculatePercentage(medium, totalFindings),
    },
    {
      name: t.overview.riskSeverity.low,
      value: low,
      percentage: calculatePercentage(low, totalFindings),
    },
    {
      name: t.overview.riskSeverity.info,
      value: informational,
      percentage: calculatePercentage(informational, totalFindings),
    },
  ];

  return (
    <Card
      variant="base"
      className="flex min-h-[372px] min-w-[312px] flex-1 flex-col md:min-w-[380px]"
    >
      <CardHeader>
        <CardTitle>{t.overview.riskSeverity.title}</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 items-center justify-start px-6">
        <HorizontalBarChart data={chartData} onBarClick={handleBarClick} />
      </CardContent>
    </Card>
  );
};
