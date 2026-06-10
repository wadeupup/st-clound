"use client";
import { useI18n } from "@/lib/i18n/context";

export const ErrorDisplay = ({ error }: { error: string }) => {
  const { t } = useI18n();
  return (
    <div className="text-small mb-4 flex rounded-lg border border-red-500 bg-red-100 p-2 text-red-700">
      <p className="mr-2 font-semibold">{t.resources.error}</p>
      <p>{error}</p>
    </div>
  );
};
