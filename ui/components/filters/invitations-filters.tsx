"use client";
import { Translations } from "@/lib/i18n";
import { FilterOption } from "@/types/filters";
import { ProviderConnectionStatus } from "@/types/providers";

export const getFilterInvitations = (t: Translations): FilterOption[] => {
  return [
    {
      key: "state",
      labelCheckboxGroup: t.invitations.filters.state,
      values: ["pending", "accepted", "expired", "revoked"],
      valueLabelMapping: [
        {
          pending: {
            label: t.invitations.filters.pending,
            value: "pending",
          } as ProviderConnectionStatus,
        },
        {
          accepted: {
            label: t.invitations.filters.accepted,
            value: "accepted",
          } as ProviderConnectionStatus,
        },
        {
          expired: {
            label: t.invitations.filters.expired,
            value: "expired",
          } as ProviderConnectionStatus,
        },
        {
          revoked: {
            label: t.invitations.filters.revoked,
            value: "revoked",
          } as ProviderConnectionStatus,
        },
      ],
    },
  ];
};
