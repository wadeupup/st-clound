import { Input } from "@heroui/input";
import { SearchIcon, XCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { useUrlFilters } from "@/hooks/use-url-filters";
import { useI18n } from "@/lib/i18n/context";

export const CustomSearchInput: React.FC = () => {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const { updateFilter } = useUrlFilters();
  const [searchQuery, setSearchQuery] = useState("");
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const applySearch = useCallback(
    (query: string) => {
      if (query) {
        updateFilter("search", query);
      } else {
        updateFilter("search", null);
      }
    },
    [updateFilter],
  );

  const debouncedChangeHandler = useCallback(
    (value: string) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = setTimeout(() => {
        applySearch(value);
      }, 300);
    },
    [applySearch],
  );

  const clearIconSearch = () => {
    setSearchQuery("");
    applySearch("");
  };

  useEffect(() => {
    const searchFromUrl = searchParams.get("filter[search]") || "";
    setSearchQuery(searchFromUrl);
  }, [searchParams]);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Input
      style={{
        borderRadius: "0.5rem",
      }}
      classNames={{
        base: "w-full [&]:!rounded-lg [&>*]:!rounded-lg",
        input:
          "text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 text-sm",
        inputWrapper:
          "!border-slate-200 !bg-white/80 backdrop-blur-sm dark:!border-slate-800 dark:!bg-slate-900/80 dark:hover:!bg-slate-900/90 hover:!bg-slate-50/90 dark:hover:!bg-slate-800/90 !border [&]:!rounded-lg !shadow-sm !transition-[color,box-shadow] focus-within:!border-slate-300 dark:focus-within:!border-slate-700 focus-within:!ring-1 focus-within:!ring-slate-300 dark:focus-within:!ring-slate-700 focus-within:!ring-offset-1 !h-10 !px-4 !py-3 !outline-none",
        clearButton: "text-slate-600 dark:text-slate-400",
      }}
      aria-label={t.findings.searchPlaceholder}
      placeholder={t.findings.searchPlaceholder}
      value={searchQuery}
      startContent={
        <SearchIcon
          className="shrink-0 text-slate-600 dark:text-slate-400"
          width={16}
        />
      }
      onChange={(e) => {
        const value = e.target.value;
        setSearchQuery(value);
        debouncedChangeHandler(value);
      }}
      endContent={
        searchQuery && (
          <button
            onClick={clearIconSearch}
            className="shrink-0 text-slate-600 focus:outline-none dark:text-slate-400"
          >
            <XCircle className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </button>
        )
      }
    />
  );
};
