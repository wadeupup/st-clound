"use client";
import { useMemo } from "react";

import { DataTable } from "@/components/ui/table";
import { getColumnsUser } from "@/components/users/table/column-users";
import { useI18n } from "@/lib/i18n/context";
import { MetaDataProps, UserProps } from "@/types";

export function UsersTable({
  data,
  metadata,
}: {
  data: UserProps[];
  metadata?: MetaDataProps;
}) {
  const { t, locale } = useI18n();

  const columns = useMemo(() => getColumnsUser(t), [t, locale]);

  return (
    <DataTable key={locale} columns={columns} data={data} metadata={metadata} />
  );
}
