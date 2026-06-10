"use client";
import { useMemo } from "react";

import { getColumnProviders } from "@/components/providers/table";
import { DataTable } from "@/components/ui/table";
import { useI18n } from "@/lib/i18n/context";
import { MetaDataProps, ProviderProps } from "@/types";

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
    <DataTable key={locale} columns={columns} data={data} metadata={metadata} />
  );
};
