"use client";
import { useMemo } from "react";

import { getColumnsRoles } from "@/components/roles/table/column-roles";
import { DataTable } from "@/components/ui/table";
import { useI18n } from "@/lib/i18n/context";
import { MetaDataProps, RolesProps } from "@/types";

export function RolesTable({
  data,
  metadata,
}: {
  data: RolesProps["data"];
  metadata?: MetaDataProps;
}) {
  const { t, locale } = useI18n();

  const columns = useMemo(() => getColumnsRoles(t), [t, locale]);

  return (
    <DataTable key={locale} columns={columns} data={data} metadata={metadata} />
  );
}
