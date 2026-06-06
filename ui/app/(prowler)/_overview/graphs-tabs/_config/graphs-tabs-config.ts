import { Translations } from "@/lib/i18n";

export const getGraphTabs = (t: Translations["overview"]["graphsTabs"]) => [
  {
    id: "findings" as const,
    label: t.newFindings,
  },
  {
    id: "threat-map" as const,
    label: t.threatMap,
  },
  {
    id: "risk-radar" as const,
    label: t.riskRadar,
  },
  {
    id: "risk-pipeline" as const,
    label: t.riskPipeline,
  },
  {
    id: "risk-plot" as const,
    label: t.riskPlot,
  },
];

export type TabId = "findings" | "threat-map" | "risk-radar" | "risk-pipeline" | "risk-plot";
