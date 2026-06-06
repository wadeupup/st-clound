"use client";

import Link from "next/link";

import { Button } from "@/components/shadcn";
import { useI18n } from "@/lib/i18n/context";

interface LinkToScansProps {
  providerUid?: string;
}

export const LinkToScans = ({ providerUid }: LinkToScansProps) => {
  const { t } = useI18n();
  return (
    <Button asChild variant="link" size="sm" className="text-xs">
      <Link href={`/scans?filter[provider_uid]=${providerUid}`}>
        {t.scans.linkToScans.viewScanJobs}
      </Link>
    </Button>
  );
};
