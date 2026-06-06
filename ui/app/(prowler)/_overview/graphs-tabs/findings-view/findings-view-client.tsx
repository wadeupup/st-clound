"use client";

import { Spacer } from "@heroui/spacer";

import { LinkToFindings } from "@/components/overview";
import { ColumnNewFindingsToDate } from "@/components/overview/new-findings-table/table/column-new-findings-to-date";
import { DataTable } from "@/components/ui/table";
import { useI18n } from "@/lib/i18n/context";
import { FindingProps } from "@/types";

interface FindingsViewClientProps {
  data: FindingProps[];
}

export function FindingsViewClient({ data }: FindingsViewClientProps) {
  const { t } = useI18n();

  return (
    <div className="flex w-full flex-col">
      <div className="relative flex w-full">
        <div className="flex w-full items-center gap-2">
          <h3 className="text-sm font-bold uppercase">
            {t.overview.graphsTabs.latestNewFailingFindings}
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-xs">
            {t.overview.graphsTabs.showingLatestFindings}
          </p>
        </div>
        <div className="absolute -top-6 right-0">
          <LinkToFindings />
        </div>
      </div>
      <Spacer y={4} />

      <DataTable
        key={`dashboard-findings-${Date.now()}`}
        columns={ColumnNewFindingsToDate}
        data={data}
        emptyMessage={t.overview.graphsTabs.noResults}
      />
    </div>
  );
}

