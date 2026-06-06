import { Skeleton } from "@heroui/skeleton";
import { Suspense } from "react";

import { SearchParamsProps } from "@/types";

import { GraphsTabsClient } from "./_components/graphs-tabs-client";
import { type TabId } from "./_config/graphs-tabs-config";
import { FindingsViewSSR } from "./findings-view";
import { RiskPipelineViewSSR } from "./risk-pipeline-view/risk-pipeline-view.ssr";
import { RiskPlotSSR } from "./risk-plot/risk-plot.ssr";
import { RiskRadarViewSSR } from "./risk-radar-view/risk-radar-view.ssr";
import { ThreatMapViewSSR } from "./threat-map-view/threat-map-view.ssr";

const LoadingFallback = () => (
  <div className="border-slate-200 bg-white/80 backdrop-blur-sm shadow-lg dark:border-slate-800 dark:bg-slate-900/80 flex w-full flex-col space-y-4 rounded-lg border p-4">
    <Skeleton className="bg-slate-200 dark:bg-slate-700 h-6 w-1/3 rounded" />
    <Skeleton className="bg-slate-200 dark:bg-slate-700 h-[457px] w-full rounded" />
  </div>
);

type GraphComponent = React.ComponentType<{ searchParams: SearchParamsProps }>;

const GRAPH_COMPONENTS: Record<TabId, GraphComponent> = {
  findings: FindingsViewSSR as GraphComponent,
  "risk-pipeline": RiskPipelineViewSSR as GraphComponent,
  "threat-map": ThreatMapViewSSR as GraphComponent,
  "risk-plot": RiskPlotSSR as GraphComponent,
  "risk-radar": RiskRadarViewSSR as GraphComponent,
};

interface GraphsTabsWrapperProps {
  searchParams: SearchParamsProps;
}

export const GraphsTabsWrapper = async ({
  searchParams,
}: GraphsTabsWrapperProps) => {
  // Define all tab IDs (order matches the client-side tabs)
  const tabIds: TabId[] = ["findings", "threat-map", "risk-radar", "risk-pipeline", "risk-plot"];
  
  const tabsContent = Object.fromEntries(
    tabIds.map((tabId) => {
      const Component = GRAPH_COMPONENTS[tabId];
      return [
        tabId,
        <Suspense key={tabId} fallback={<LoadingFallback />}>
          <Component searchParams={searchParams} />
        </Suspense>,
      ];
    }),
  ) as Record<TabId, React.ReactNode>;

  return <GraphsTabsClient tabsContent={tabsContent} />;
};
