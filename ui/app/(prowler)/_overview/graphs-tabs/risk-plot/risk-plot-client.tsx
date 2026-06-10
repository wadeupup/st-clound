"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import type { RiskPlotPoint } from "@/actions/overview/risk-plot";
import { HorizontalBarChart } from "@/components/graphs/horizontal-bar-chart";
import { ScatterPlot } from "@/components/graphs/scatter-plot";
import { AlertPill } from "@/components/graphs/shared/alert-pill";
import type { BarDataPoint } from "@/components/graphs/types";
import { useI18n } from "@/lib/i18n/context";
import { mapProviderFiltersForFindings } from "@/lib/provider-helpers";
import { SEVERITY_FILTER_MAP } from "@/types/severities";

// Score color thresholds (0-100 scale, higher = better)
const SCORE_COLORS = {
  DANGER: "var(--bg-fail-primary)", // 0-30
  WARNING: "var(--bg-warning-primary)", // 31-60
  SUCCESS: "var(--bg-pass-primary)", // 61-100
} as const;

function getScoreColor(score: number): string {
  if (score > 60) return SCORE_COLORS.SUCCESS;
  if (score > 30) return SCORE_COLORS.WARNING;
  return SCORE_COLORS.DANGER;
}

interface RiskPlotClientProps {
  data: RiskPlotPoint[];
}

export function RiskPlotClient({ data }: RiskPlotClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const [selectedPoint, setSelectedPoint] = useState<RiskPlotPoint | null>(
    null,
  );
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  const handleBarClick = (dataPoint: BarDataPoint) => {
    if (!selectedPoint) return;

    // Build the URL with current filters
    const params = new URLSearchParams(searchParams.toString());

    // Transform provider filters (provider_id__in -> provider__in)
    mapProviderFiltersForFindings(params);

    // Add severity filter
    const severity = SEVERITY_FILTER_MAP[dataPoint.name];
    if (severity) {
      params.set("filter[severity__in]", severity);
    }

    // Add provider filter for the selected point
    params.set("filter[provider__in]", selectedPoint.providerId);

    // Add exclude muted findings filter
    params.set("filter[muted]", "false");

    // Filter by FAIL findings
    params.set("filter[status__in]", "FAIL");

    // Navigate to findings page
    router.push(`/findings?${params.toString()}`);
  };

  const renderTooltip = (point: RiskPlotPoint) => {
    const scoreColor = getScoreColor(point.x);

    return (
      <div className="pointer-events-none min-w-[200px] rounded-xl border border-slate-200 bg-white/80 p-3 shadow-lg backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/50">
        <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          {point.name}
        </p>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
          <span style={{ color: scoreColor, fontWeight: "bold" }}>
            {point.x}%
          </span>{" "}
          {t.overview.graphsTabs.threatScore}
        </p>
        <div className="mt-2">
          <AlertPill value={point.y} />
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full w-full flex-col gap-4">
      <div className="flex flex-1 gap-12">
        {/* Plot Section - in Card */}
        <div className="flex basis-[70%] flex-col">
          <div className="flex flex-1 flex-col rounded-lg border border-slate-200 bg-white/80 p-4 shadow-lg backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {t.overview.graphsTabs.riskPlotTitle}
              </h3>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                {t.overview.graphsTabs.riskPlotDescription}
              </p>
            </div>

            <ScatterPlot<RiskPlotPoint>
              data={data}
              xAxis={{
                label: t.overview.graphsTabs.failFindings,
                dataKey: "y",
              }}
              yAxis={{
                label: t.overview.graphsTabs.threatScore,
                dataKey: "x",
                domain: [0, 100],
              }}
              selectedPoint={selectedPoint}
              onSelectPoint={setSelectedPoint}
              selectedProvider={selectedProvider}
              onProviderClick={setSelectedProvider}
              gradient={{
                id: "riskPlotGradient",
                color: "#7D1A1A",
                fromBottom: true,
              }}
              renderTooltip={renderTooltip}
            />
          </div>
        </div>

        {/* Details Section - No Card */}
        <div className="flex basis-[30%] flex-col items-center justify-center overflow-hidden">
          {selectedPoint && selectedPoint.severityData ? (
            <div className="flex w-full flex-col">
              <div className="mb-4">
                <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {selectedPoint.name}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {t.overview.graphsTabs.threatScore}: {selectedPoint.x}% |{" "}
                  {t.overview.graphsTabs.failFindings}: {selectedPoint.y}
                </p>
              </div>
              <HorizontalBarChart
                data={selectedPoint.severityData}
                onBarClick={handleBarClick}
              />
            </div>
          ) : (
            <div className="flex w-full items-center justify-center text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Select a point on the plot to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
