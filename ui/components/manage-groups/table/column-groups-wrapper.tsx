"use client";

import { useMemo } from "react";

import { DataTable } from "@/components/ui/table";
import { useI18n } from "@/lib/i18n/context";
import { ProviderGroup } from "@/types";
import { ProviderGroupsResponse } from "@/types/components";

import { getColumnGroups } from "./column-groups";

export function ColumnGroupsWrapper({
  data,
  metadata,
}: {
  data: ProviderGroup[];
  metadata?: ProviderGroupsResponse["meta"];
}) {
  const { t, locale } = useI18n();
  const columns = useMemo(() => getColumnGroups(t), [t, locale]);

  return (
    <DataTable columns={columns} data={data} metadata={metadata} key={locale} />
  );
}
