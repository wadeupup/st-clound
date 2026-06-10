"use client";
import { useMemo } from "react";

import { getFilterProviders } from "@/components/filters/providers-filters";
import { DataTableFilterCustom } from "@/components/ui/table";
import { useI18n } from "@/lib/i18n/context";

export const ProvidersFilters = () => {
  const { locale, t } = useI18n();
  const filters = useMemo(() => getFilterProviders(t), [locale, t]);
  return <DataTableFilterCustom key={locale} filters={filters} />;
};
