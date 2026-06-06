import {
  adaptCategoryOverviewToRadarData,
  getCategoryOverview,
} from "@/actions/overview/risk-radar";
import { SearchParamsProps } from "@/types";

import { pickFilterParams } from "../../_lib/filter-params";
import { RiskRadarViewEmpty } from "./risk-radar-view-empty";
import { RiskRadarViewClient } from "./risk-radar-view-client";

export async function RiskRadarViewSSR({
  searchParams,
}: {
  searchParams: SearchParamsProps;
}) {
  const filters = pickFilterParams(searchParams);

  // Fetch category overview data
  const categoryResponse = await getCategoryOverview({ filters });

  // Transform to radar chart format
  const radarData = adaptCategoryOverviewToRadarData(categoryResponse);

  // No data available
  if (radarData.length === 0) {
    return <RiskRadarViewEmpty />;
  }

  return <RiskRadarViewClient data={radarData} />;
}
