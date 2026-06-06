"use client";

import { useI18n } from "@/lib/i18n/context";

export function ScansTitle() {
  const { t } = useI18n();
  return <>{t.scans.title}</>;
}

