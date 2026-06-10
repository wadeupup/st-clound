"use client";
import { useMemo } from "react";

import { getFilterUsers } from "@/components/filters/users-filters";
import { DataTableFilterCustom } from "@/components/ui/table";
import { useI18n } from "@/lib/i18n/context";

export const UsersFilters = () => {
  const { locale, t } = useI18n();
  const filters = useMemo(() => getFilterUsers(t), [locale, t]);
  return <DataTableFilterCustom key={locale} filters={filters} />;
};
