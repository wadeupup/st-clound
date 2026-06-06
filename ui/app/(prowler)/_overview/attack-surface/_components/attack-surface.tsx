"use client";

import { AttackSurfaceItem } from "@/actions/overview";
import { Card, CardContent, CardTitle } from "@/components/shadcn";
import { useI18n } from "@/lib/i18n/context";

import { AttackSurfaceCardItem } from "./attack-surface-card-item";

interface AttackSurfaceProps {
  items: AttackSurfaceItem[];
  filters?: Record<string, string | string[] | undefined>;
}

export function AttackSurface({ items, filters }: AttackSurfaceProps) {
  const { t } = useI18n();
  const isEmpty = items.length === 0;

  return (
    <Card variant="base" className="flex w-full flex-col">
      <CardTitle>{t.overview.attackSurface.title}</CardTitle>
      <CardContent className="mt-4 flex flex-wrap gap-4">
        {isEmpty ? (
          <div
            className="flex w-full items-center justify-center py-8"
            role="status"
          >
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              {t.overview.attackSurface.noDataAvailable}
            </p>
          </div>
        ) : (
          items.map((item) => (
            <AttackSurfaceCardItem
              key={item.id}
              item={item}
              filters={filters}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
