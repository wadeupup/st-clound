"use client";
import { Translations } from "@/lib/i18n";
import { FilterOption, FilterEntity } from "@/types/filters";
import {
  PROVIDER_DISPLAY_NAMES,
  PROVIDER_TYPES,
  ProviderType,
} from "@/types/providers";
import { ProviderConnectionStatus } from "@/types/providers";

// Create a mapping for provider types to display with icons and labels
const PROVIDER_TYPE_MAPPING = PROVIDER_TYPES.map((providerType) => ({
  [providerType]: {
    provider: providerType as ProviderType,
    uid: "",
    alias: PROVIDER_DISPLAY_NAMES[providerType],
  },
}));

export const getFilterProviders = (t: Translations): FilterOption[] => {
  // Create connection status mapping with translations
  const connectionStatusMapping: Array<{
    [key: string]: FilterEntity;
  }> = [
    {
      true: {
        label: t.providers.filters.connected,
        value: "true",
      } as ProviderConnectionStatus,
    },
    {
      false: {
        label: t.providers.filters.disconnected,
        value: "false",
      } as ProviderConnectionStatus,
    },
  ];

  return [
    {
      key: "connected",
      labelCheckboxGroup: t.providers.filters.connection,
      values: ["true", "false"],
      valueLabelMapping: connectionStatusMapping,
    },
    {
      key: "provider__in",
      labelCheckboxGroup: t.providers.filters.cloudProvider,
      values: [...PROVIDER_TYPES],
      valueLabelMapping: PROVIDER_TYPE_MAPPING,
    },
  ];
};

