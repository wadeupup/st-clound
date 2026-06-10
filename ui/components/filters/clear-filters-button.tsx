"use client";

import { XCircle } from "lucide-react";

import { useUrlFilters } from "@/hooks/use-url-filters";
import { useI18n } from "@/lib/i18n/context";

import { Button } from "../shadcn";

export interface ClearFiltersButtonProps {
  className?: string;
  text?: string;
  ariaLabel?: string;
}

export const ClearFiltersButton = ({
  text,
  ariaLabel,
}: ClearFiltersButtonProps) => {
  const { t } = useI18n();
  const { clearAllFilters, hasFilters } = useUrlFilters();
  const displayText = text || t.findings.filters.clearAllFilters;
  const displayAriaLabel = ariaLabel || t.findings.filters.clearAllFilters;

  if (!hasFilters()) {
    return null;
  }

  return (
    <Button
      aria-label={displayAriaLabel}
      onClick={clearAllFilters}
      variant="link"
    >
      <XCircle className="mr-0.5 size-4" />
      {displayText}
    </Button>
  );
};
