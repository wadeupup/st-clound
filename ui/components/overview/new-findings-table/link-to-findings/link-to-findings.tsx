"use client";

import Link from "next/link";

import { Button } from "@/components/shadcn/button/button";
import { useI18n } from "@/lib/i18n/context";

export const LinkToFindings = () => {
  const { t } = useI18n();

  return (
    <div className="mt-4 flex w-full items-center justify-end">
      <Button asChild variant="default" size="sm">
        <Link
          href="/findings?sort=severity,-inserted_at&filter[status__in]=FAIL&filter[delta__in]=new"
          aria-label="Go to Findings page"
        >
          {t.overview.graphsTabs.checkOutOnFindings}
        </Link>
      </Button>
    </div>
  );
};
