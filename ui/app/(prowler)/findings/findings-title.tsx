"use client";

import { useI18n } from "@/lib/i18n/context";

export function FindingsTitle() {
  const { t } = useI18n();
  return <>{t.findings.title}</>;
}

