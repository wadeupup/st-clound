"use client";
import { useMemo } from "react";
import { useI18n } from "@/lib/i18n/context";
import { DataTable } from "@/components/ui/table";
import { getColumnResources } from "@/components/resources/table/column-resources";
import { ResourceProps, MetaDataProps } from "@/types";

export function ResourcesTable({
  data,
  metadata,
}: {
  data: ResourceProps[];
  metadata?: MetaDataProps;
}) {
  const { t, locale } = useI18n();

  const columns = useMemo(
    () => getColumnResources(t),
    [t, locale],
  );

  return (
    <DataTable
      key={locale}
      columns={columns}
      data={data}
      metadata={metadata}
    />
  );
}

