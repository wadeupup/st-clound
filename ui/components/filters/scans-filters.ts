import {
  PROVIDER_DISPLAY_NAMES,
  ProviderType,
} from "@/types/providers";

import { FilterOption } from "@/types";

// Only AWS and Azure for Scan Jobs page
const SCAN_PROVIDER_TYPES = ["aws", "azure"] as const;

// Create a mapping for provider types to display with icons and labels
const PROVIDER_TYPE_MAPPING = SCAN_PROVIDER_TYPES.map((providerType) => ({
  [providerType]: {
    provider: providerType as ProviderType,
    uid: "",
    alias: PROVIDER_DISPLAY_NAMES[providerType],
  },
}));

export const getFilterScans = (t: {
  scans: {
    filters: {
      cloudProvider: string;
      status: string;
      trigger: string;
      providerUid: string;
      statusValues: {
        available: string;
        scheduled: string;
        executing: string;
        completed: string;
        failed: string;
        cancelled: string;
      };
      triggerValues: {
        scheduled: string;
        manual: string;
      };
    };
  };
}): FilterOption[] => [
  {
    key: "provider_type__in",
    labelCheckboxGroup: t.scans.filters.cloudProvider,
    values: [...SCAN_PROVIDER_TYPES],
    valueLabelMapping: PROVIDER_TYPE_MAPPING,
    index: 0,
  },
  {
    key: "state__in",
    labelCheckboxGroup: t.scans.filters.status,
    values: [
      "available",
      "scheduled",
      "executing",
      "completed",
      "failed",
      "cancelled",
    ],
    labelFormatter: (value: string) => {
      const statusMap: Record<string, string> = {
        available: t.scans.filters.statusValues.available,
        scheduled: t.scans.filters.statusValues.scheduled,
        executing: t.scans.filters.statusValues.executing,
        completed: t.scans.filters.statusValues.completed,
        failed: t.scans.filters.statusValues.failed,
        cancelled: t.scans.filters.statusValues.cancelled,
      };
      return statusMap[value] || value;
    },
    index: 2,
  },
  {
    key: "trigger",
    labelCheckboxGroup: t.scans.filters.trigger,
    values: ["scheduled", "manual"],
    labelFormatter: (value: string) => {
      const triggerMap: Record<string, string> = {
        scheduled: t.scans.filters.triggerValues.scheduled,
        manual: t.scans.filters.triggerValues.manual,
      };
      return triggerMap[value] || value;
    },
    index: 3,
  },
];

