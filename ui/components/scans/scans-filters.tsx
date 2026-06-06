"use client";

import { useMemo } from "react";

import { getFilterScans } from "@/components/filters/scans-filters";
import { FilterControls } from "@/components/filters/filter-controls";
import { useRelatedFilters } from "@/hooks";
import { useI18n } from "@/lib/i18n/context";
import { FilterEntity, FilterType } from "@/types";

interface ScansFiltersProps {
  providerUIDs: string[];
  providerDetails: { [uid: string]: FilterEntity }[];
}

export const ScansFilters = ({
  providerUIDs,
  providerDetails,
}: ScansFiltersProps) => {
  const { t, locale } = useI18n();
  const { availableProviderUIDs } = useRelatedFilters({
    providerUIDs,
    providerDetails,
    enableScanRelation: false,
    providerFilterType: FilterType.PROVIDER_UID,
  });

  const filters = useMemo(() => getFilterScans(t), [t, locale]);

  return (
    <FilterControls
      customFilters={[
        ...filters,
        {
          key: FilterType.PROVIDER_UID,
          labelCheckboxGroup: t.scans.filters.providerUid,
          values: availableProviderUIDs,
          valueLabelMapping: providerDetails,
          index: 1,
        },
      ]}
      key={locale}
    />
  );
};
