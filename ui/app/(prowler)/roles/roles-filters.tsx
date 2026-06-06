"use client";
import { useMemo } from "react";
import { DataTableFilterCustom } from "@/components/ui/table";
import { getFilterRoles } from "@/components/filters/roles-filters";
import { useI18n } from "@/lib/i18n/context";

export const RolesFilters = () => {
  const { locale, t } = useI18n();
  const filters = useMemo(() => getFilterRoles(t), [locale, t]);
  return <DataTableFilterCustom key={locale} filters={filters} />;
};

