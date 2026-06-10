"use client";
import { Translations } from "@/lib/i18n";
import { FilterOption } from "@/types/filters";
import { ProviderConnectionStatus } from "@/types/providers";

export const getFilterRoles = (t: Translations): FilterOption[] => {
  return [
    {
      key: "permission_state",
      labelCheckboxGroup: t.roles.filters.permissions,
      values: ["unlimited", "limited", "none"],
      valueLabelMapping: [
        {
          unlimited: {
            label: t.roles.filters.unlimited,
            value: "unlimited",
          } as ProviderConnectionStatus,
        },
        {
          limited: {
            label: t.roles.filters.limited,
            value: "limited",
          } as ProviderConnectionStatus,
        },
        {
          none: {
            label: t.roles.filters.none,
            value: "none",
          } as ProviderConnectionStatus,
        },
      ],
    },
  ];
};
