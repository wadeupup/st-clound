"use client";
import { useMemo } from "react";
import { useI18n } from "@/lib/i18n/context";
import { DataTable } from "@/components/ui/table";
import { getColumnsInvitation } from "@/components/invitations/table/column-invitations";
import { InvitationProps, MetaDataProps } from "@/types";

export function InvitationsTable({
  data,
  metadata,
}: {
  data: InvitationProps[];
  metadata?: MetaDataProps;
}) {
  const { t, locale } = useI18n();

  const columns = useMemo(
    () => getColumnsInvitation(t),
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

