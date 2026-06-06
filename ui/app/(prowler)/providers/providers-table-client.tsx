"use client";
import { useMemo } from "react";
import { DataTable } from "@/components/ui/table";
import { getColumnProviders } from "@/components/providers/table";
import { useI18n } from "@/lib/i18n/context";
import { ProviderProps, MetaDataProps } from "@/types";

interface ProvidersTableClientProps {
  data: ProviderProps[];
  metadata?: MetaDataProps;
}

export const ProvidersTableClient = ({
  data,
  metadata,
}: ProvidersTableClientProps) => {
  const { locale, t } = useI18n();
  const columns = useMemo(() => getColumnProviders(t), [locale, t]);

  return (
    <DataTable
      key={locale}
      columns={columns}
      data={data}
      metadata={metadata}
    />
  );
};

