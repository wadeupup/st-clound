"use client";
import { Translations } from "@/lib/i18n";
import { FilterOption } from "@/types/filters";
import { ProviderConnectionStatus } from "@/types/providers";

export const getFilterUsers = (t: Translations): FilterOption[] => {
  return [
    {
      key: "is_active",
      labelCheckboxGroup: t.users.filters.status,
      values: ["true", "false"],
      valueLabelMapping: [
        {
          true: {
            label: t.users.filters.active,
            value: "true",
          } as ProviderConnectionStatus,
        },
        {
          false: {
            label: t.users.filters.inactive,
            value: "false",
          } as ProviderConnectionStatus,
        },
      ],
    },
  ];
};
