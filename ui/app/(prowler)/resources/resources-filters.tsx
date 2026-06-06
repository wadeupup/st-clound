"use client";
import { useI18n } from "@/lib/i18n/context";
import { DataTableFilterCustom } from "@/components/ui/table";

export const ResourcesFilters = ({
  uniqueRegions,
  uniqueResourceTypes,
  uniqueServices,
}: {
  uniqueRegions: string[];
  uniqueResourceTypes: string[];
  uniqueServices: string[];
}) => {
  const { t } = useI18n();

  return (
    <DataTableFilterCustom
      filters={[
        {
          key: "region",
          labelCheckboxGroup: t.resources.filters.region,
          values: uniqueRegions,
        },
        {
          key: "type",
          labelCheckboxGroup: t.resources.filters.type,
          values: uniqueResourceTypes,
        },
        {
          key: "service",
          labelCheckboxGroup: t.resources.filters.service,
          values: uniqueServices,
        },
      ]}
    />
  );
};

