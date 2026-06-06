"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { ServiceOverview } from "@/actions/overview";
import { useI18n } from "@/lib/i18n/context";
import { mapProviderFiltersForFindings } from "@/lib/provider-helpers";

import { SortToggleButton } from "./sort-toggle-button";
import { WatchlistCard, WatchlistItem } from "./watchlist-card";

export const ServiceWatchlist = ({ items }: { items: ServiceOverview[] }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const [isAsc, setIsAsc] = useState(false);

  const sortedItems = [...items]
    .sort((a, b) =>
      isAsc
        ? a.attributes.fail - b.attributes.fail
        : b.attributes.fail - a.attributes.fail,
    )
    .slice(0, 5)
    .map((item) => ({
      key: item.id,
      label: item.id,
      value: item.attributes.fail,
    }));

  const handleItemClick = (item: WatchlistItem) => {
    const params = new URLSearchParams(searchParams.toString());

    mapProviderFiltersForFindings(params);

    params.set("filter[service__in]", item.key);
    params.set("filter[status__in]", "FAIL");
    router.push(`/findings?${params.toString()}`);
  };

  return (
    <WatchlistCard
      title={t.overview.serviceWatchlist.title}
      items={sortedItems}
      headerAction={
        <SortToggleButton
          isAscending={isAsc}
          onToggle={() => setIsAsc(!isAsc)}
          ascendingLabel={t.overview.serviceWatchlist.sortByHighest}
          descendingLabel={t.overview.serviceWatchlist.sortByLowest}
        />
      }
      emptyState={{
        message: t.overview.serviceWatchlist.emptyState,
      }}
      onItemClick={handleItemClick}
      useFailureColoring
    />
  );
};
