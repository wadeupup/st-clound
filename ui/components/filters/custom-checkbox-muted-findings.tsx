"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Checkbox } from "@/components/shadcn";
import { useI18n } from "@/lib/i18n/context";

// Constants for muted filter URL values
const MUTED_FILTER_VALUES = {
  EXCLUDE: "false",
  INCLUDE: "include",
} as const;

export const CustomCheckboxMutedFindings = () => {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get the current muted filter value from URL
  // Middleware ensures filter[muted] is always present when navigating to /findings
  const mutedFilterValue = searchParams.get("filter[muted]");

  // URL states:
  // - filter[muted]=false → Exclude muted (checkbox UNCHECKED)
  // - filter[muted]=include → Include muted (checkbox CHECKED)
  const includeMuted = mutedFilterValue === MUTED_FILTER_VALUES.INCLUDE;

  const handleMutedChange = (checked: boolean | "indeterminate") => {
    const isChecked = checked === true;
    const params = new URLSearchParams(searchParams.toString());

    if (isChecked) {
      // Include muted: set special value (API will ignore invalid value and show all)
      params.set("filter[muted]", MUTED_FILTER_VALUES.INCLUDE);
    } else {
      // Exclude muted: apply filter to show only non-muted
      params.set("filter[muted]", MUTED_FILTER_VALUES.EXCLUDE);
    }

    // Reset to page 1 when changing filter
    if (params.has("page")) {
      params.set("page", "1");
    }

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex h-full items-center gap-2 text-nowrap">
      <Checkbox
        id="include-muted"
        checked={includeMuted}
        onCheckedChange={handleMutedChange}
        aria-label={t.findings.filters.includeMutedFindings}
      />
      <label
        htmlFor="include-muted"
        className="cursor-pointer text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {t.findings.filters.includeMutedFindings}
      </label>
    </div>
  );
};
