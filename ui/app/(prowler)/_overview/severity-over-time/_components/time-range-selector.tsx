"use client";

import { cn } from "@/lib/utils";

import {
  TIME_RANGE_OPTIONS,
  type TimeRange,
} from "../_constants/time-range.constants";

export type { TimeRange };

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void | Promise<void>;
  isLoading?: boolean;
}

const BUTTON_STYLES = {
  base: "relative inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
  border: "border-r border-slate-200 dark:border-slate-700 last:border-r-0",
  text: "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100",
  active: "data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-100",
  underline:
    "after:absolute after:bottom-1 after:left-1/2 after:h-px after:w-0 after:-translate-x-1/2 after:bg-emerald-400 after:transition-all data-[state=active]:after:w-8",
  focus:
    "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
} as const;

export const TimeRangeSelector = ({
  value,
  onChange,
  isLoading = false,
}: TimeRangeSelectorProps) => {
  return (
    <div className="border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/50 inline-flex items-center gap-2 rounded-full border shadow-sm">
      {Object.entries(TIME_RANGE_OPTIONS).map(([key, range]) => (
        <button
          key={key}
          onClick={() => onChange(range as TimeRange)}
          disabled={isLoading || false}
          data-state={value === range ? "active" : "inactive"}
          className={cn(
            BUTTON_STYLES.base,
            BUTTON_STYLES.border,
            BUTTON_STYLES.text,
            BUTTON_STYLES.active,
            BUTTON_STYLES.underline,
            BUTTON_STYLES.focus,
            isLoading && "cursor-not-allowed opacity-50",
          )}
        >
          {range}
        </button>
      ))}
    </div>
  );
};
