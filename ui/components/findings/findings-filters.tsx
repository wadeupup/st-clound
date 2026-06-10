"use client";

import { FilterControls } from "@/components/filters/filter-controls";
import { useRelatedFilters } from "@/hooks";
import { getCategoryLabel } from "@/lib/categories";
import { useI18n } from "@/lib/i18n/context";
import { FilterEntity, FilterType, ScanEntity, ScanProps } from "@/types";
import { PROVIDER_DISPLAY_NAMES, ProviderType } from "@/types/providers";

interface FindingsFiltersProps {
  providerIds: string[];
  providerDetails: { [id: string]: FilterEntity }[];
  completedScans: ScanProps[];
  completedScanIds: string[];
  scanDetails: { [key: string]: ScanEntity }[];
  uniqueRegions: string[];
  uniqueServices: string[];
  uniqueResourceTypes: string[];
  uniqueCategories: string[];
}

export const FindingsFilters = ({
  providerIds,
  providerDetails,
  completedScanIds,
  scanDetails,
  uniqueRegions,
  uniqueServices,
  uniqueResourceTypes,
  uniqueCategories,
}: FindingsFiltersProps) => {
  const { t } = useI18n();
  const { availableProviderIds, availableScans } = useRelatedFilters({
    providerIds,
    providerDetails,
    completedScanIds,
    scanDetails,
    enableScanRelation: true,
  });

  // Create a mapping for provider types to display with icons and labels
  // Only include AWS and Azure
  const ALLOWED_PROVIDER_TYPES: ProviderType[] = ["aws", "azure"];
  const PROVIDER_TYPE_MAPPING = ALLOWED_PROVIDER_TYPES.map((providerType) => ({
    [providerType]: {
      provider: providerType as ProviderType,
      uid: "",
      alias: PROVIDER_DISPLAY_NAMES[providerType],
    },
  }));

  // Create label formatters for translated filter values
  const severityFormatter = (value: string): string => {
    const severityMap: Record<string, string> = {
      critical: t.findings.filters.severityValues.critical,
      high: t.findings.filters.severityValues.high,
      medium: t.findings.filters.severityValues.medium,
      low: t.findings.filters.severityValues.low,
      informational: t.findings.filters.severityValues.informational,
    };
    return severityMap[value] || value;
  };

  const statusFormatter = (value: string): string => {
    const statusMap: Record<string, string> = {
      PASS: t.findings.filters.statusValues.PASS,
      FAIL: t.findings.filters.statusValues.FAIL,
      MANUAL: t.findings.filters.statusValues.MANUAL,
    };
    return statusMap[value] || value;
  };

  const deltaFormatter = (value: string): string => {
    const deltaMap: Record<string, string> = {
      new: t.findings.filters.deltaValues.new,
      changed: t.findings.filters.deltaValues.changed,
    };
    return deltaMap[value] || value;
  };

  // Create translated filterFindings
  const translatedFilterFindings = [
    {
      key: FilterType.SEVERITY,
      labelCheckboxGroup: t.findings.filters.severity,
      values: ["critical", "high", "medium", "low", "informational"],
      labelFormatter: severityFormatter,
      index: 0,
    },
    {
      key: FilterType.STATUS,
      labelCheckboxGroup: t.findings.filters.status,
      values: ["PASS", "FAIL", "MANUAL"],
      labelFormatter: statusFormatter,
      index: 1,
    },
    {
      key: FilterType.PROVIDER_TYPE,
      labelCheckboxGroup: t.findings.filters.cloudProvider,
      values: ["aws", "azure"],
      valueLabelMapping: PROVIDER_TYPE_MAPPING,
      index: 5,
    },
    {
      key: FilterType.DELTA,
      labelCheckboxGroup: t.findings.filters.delta,
      values: ["new", "changed"],
      labelFormatter: deltaFormatter,
      index: 2,
    },
  ];

  return (
    <>
      <FilterControls
        search
        date
        customFilters={[
          ...translatedFilterFindings,
          {
            key: FilterType.PROVIDER,
            labelCheckboxGroup: t.findings.filters.provider,
            values: availableProviderIds,
            valueLabelMapping: providerDetails,
            index: 6,
          },
          {
            key: FilterType.REGION,
            labelCheckboxGroup: t.findings.filters.regions,
            values: uniqueRegions,
            index: 3,
          },
          {
            key: FilterType.SERVICE,
            labelCheckboxGroup: t.findings.filters.services,
            values: uniqueServices,
            index: 4,
          },
          {
            key: FilterType.RESOURCE_TYPE,
            labelCheckboxGroup: t.findings.filters.resourceType,
            values: uniqueResourceTypes,
            index: 8,
          },
          {
            key: FilterType.CATEGORY,
            labelCheckboxGroup: t.findings.filters.category,
            values: uniqueCategories,
            labelFormatter: getCategoryLabel,
            index: 5,
          },
          {
            key: FilterType.SCAN,
            labelCheckboxGroup: t.findings.filters.scanId,
            values: availableScans,
            valueLabelMapping: scanDetails,
            index: 7,
          },
        ]}
      />
    </>
  );
};
