"use client";

import { ContentLayout } from "@/components/ui";
import { useI18n } from "@/lib/i18n/context";

export function OverviewTitle({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();

  return (
    <ContentLayout title={t.overview.title} icon="lucide:square-chart-gantt">
      {children}
    </ContentLayout>
  );
}

