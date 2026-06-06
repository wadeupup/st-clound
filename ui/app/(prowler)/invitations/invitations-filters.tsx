"use client";
import { useMemo } from "react";
import { DataTableFilterCustom } from "@/components/ui/table";
import { getFilterInvitations } from "@/components/filters/invitations-filters";
import { useI18n } from "@/lib/i18n/context";

export const InvitationsFilters = () => {
  const { locale, t } = useI18n();
  const filters = useMemo(() => getFilterInvitations(t), [locale, t]);
  return <DataTableFilterCustom key={locale} filters={filters} />;
};

