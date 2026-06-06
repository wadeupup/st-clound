import {
  adaptRegionsOverviewToThreatMap,
  getRegionsOverview,
} from "@/actions/overview";
import { ThreatMap } from "@/components/graphs/threat-map";
import { SearchParamsProps } from "@/types";

import { pickFilterParams } from "../../_lib/filter-params";
import { ThreatMapViewEmpty } from "./threat-map-view-empty";

export async function ThreatMapViewSSR({
  searchParams,
}: {
  searchParams: SearchParamsProps;
}) {
  const filters = pickFilterParams(searchParams);
  const regionsResponse = await getRegionsOverview({ filters });
  const threatMapData = adaptRegionsOverviewToThreatMap(regionsResponse);

  if (threatMapData.locations.length === 0) {
    return <ThreatMapViewEmpty />;
  }

  return (
    <div className="w-full flex-1 overflow-hidden">
      <ThreatMap data={threatMapData} height={460} />
    </div>
  );
}
