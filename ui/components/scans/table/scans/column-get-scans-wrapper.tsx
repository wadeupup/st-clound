"use client";

import { useMemo } from "react";

import { DataTable } from "@/components/ui/table";
import { useI18n } from "@/lib/i18n/context";
import { ScanProps } from "@/types";
import { MetaDataProps } from "@/types/components";

import { getColumnGetScans } from "./column-get-scans";

export function ColumnGetScansWrapper({
  data,
  metadata,
}: {
  data: ScanProps[];
  metadata?: MetaDataProps;
}) {
  const { t, locale } = useI18n();
  const columns = useMemo(() => getColumnGetScans(t), [t, locale]);

  return (
    <DataTable columns={columns} data={data} metadata={metadata} key={locale} />
  );
}
