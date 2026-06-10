"use client";

import { Select, SelectItem } from "@heroui/select";
import { useEffect, useMemo, useRef } from "react";
import { Control, UseFormSetValue, useWatch } from "react-hook-form";

import { Button } from "@/components/shadcn";
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
  const hasInitializedRegions = useRef(false);
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
    if (
      !hasInitializedRegions.current &&
      selectedRegions.length === 0 &&
      defaultRegions.length > 0
    ) {
      hasInitializedRegions.current = true;
      setValue(ProviderCredentialFields.AWS_REGIONS, defaultRegions, {
        shouldDirty: false,
        shouldValidate: false,
      });
    }
  }, [defaultRegions, selectedRegions.length, setValue]);

  const setSelectedRegions = (nextRegions: string[]) => {
    setValue(ProviderCredentialFields.AWS_REGIONS, nextRegions, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <div className="flex flex-col gap-2">
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
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            setSelectedRegions(regionOptions.map((region) => region.value))
          }
        >
          Select all
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            setValue(ProviderCredentialFields.AWS_REGIONS, [], {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
        >
          Clear
        </Button>
      </div>
    </div>
  );
};
