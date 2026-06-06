"use client";

import { useI18n } from "@/lib/i18n/context";

interface ErrorDisplayProps {
  error: string;
}

export function ErrorDisplay({ error }: ErrorDisplayProps) {
  const { t } = useI18n();
  return (
    <div className="text-small mb-4 flex rounded-lg border border-red-500 bg-red-100 p-2 text-red-700">
      <p className="mr-2 font-semibold">{t.findings.error}</p>
      <p>{error}</p>
    </div>
  );
}

