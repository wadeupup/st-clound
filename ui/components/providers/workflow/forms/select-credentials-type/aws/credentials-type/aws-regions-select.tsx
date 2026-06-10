"use client";

import { Select, SelectItem } from "@heroui/select";
import { useEffect, useMemo } from "react";
import { Control, UseFormSetValue, useWatch } from "react-hook-form";

import { useI18n } from "@/lib/i18n/context";
import { ProviderCredentialFields } from "@/lib/provider-credentials/provider-credential-fields";

export type AWSRegionOption = {
  value: string;
  label: string;
};

export const AWSRegionsSelect = ({
  control,
  setValue,
  regions,
  defaultRegions,
}: {
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  regions: AWSRegionOption[];
  defaultRegions: string[];
}) => {
  const { t } = useI18n();
  const regionLabel = `AWS ${t.compliance.regions}`;
  const watchedRegions = useWatch({
    control,
    name: ProviderCredentialFields.AWS_REGIONS,
    defaultValue: [],
  }) as string[] | string | undefined;

  const selectedRegions = Array.isArray(watchedRegions)
    ? watchedRegions
    : watchedRegions
      ? [watchedRegions]
      : [];

  const regionOptions = useMemo(() => {
    const options = new Map<string, AWSRegionOption>();
    regions.forEach((region) => options.set(region.value, region));
    defaultRegions.forEach((region) => {
      if (!options.has(region)) {
        options.set(region, { value: region, label: region });
      }
    });
    return Array.from(options.values());
  }, [regions, defaultRegions]);

  useEffect(() => {
    if (selectedRegions.length === 0 && defaultRegions.length > 0) {
      setValue(ProviderCredentialFields.AWS_REGIONS, defaultRegions, {
        shouldDirty: false,
        shouldValidate: false,
      });
    }
  }, [defaultRegions, selectedRegions.length, setValue]);

  return (
    <Select
      label={regionLabel}
      placeholder={regionLabel}
      selectedKeys={new Set(selectedRegions)}
      selectionMode="multiple"
      variant="bordered"
      isRequired
      onSelectionChange={(keys) => {
        const nextRegions =
          keys === "all"
            ? regionOptions.map((region) => region.value)
            : Array.from(keys).map(String);
        setValue(ProviderCredentialFields.AWS_REGIONS, nextRegions, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }}
    >
      {regionOptions.map((region) => (
        <SelectItem key={region.value} textValue={region.label}>
          {region.label}
        </SelectItem>
      ))}
    </Select>
  );
};
