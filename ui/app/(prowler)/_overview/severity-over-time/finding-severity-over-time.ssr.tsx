import { getSeverityTrendsByTimeRange } from "@/actions/overview/severity-trends";

import { pickFilterParams } from "../_lib/filter-params";
import { SSRComponentProps } from "../_types";
import { FindingSeverityOverTimeSkeleton } from "./_components/finding-severity-over-time.skeleton";
import { FindingSeverityOverTimeCard } from "./_components/finding-severity-over-time-card";
import { FindingSeverityOverTimeEmpty } from "./_components/finding-severity-over-time-empty";
import { DEFAULT_TIME_RANGE } from "./_constants/time-range.constants";

export { FindingSeverityOverTimeSkeleton };

export const FindingSeverityOverTimeSSR = async ({
  searchParams,
}: SSRComponentProps) => {
  const filters = pickFilterParams(searchParams);

  const result = await getSeverityTrendsByTimeRange({
    timeRange: DEFAULT_TIME_RANGE,
    filters,
  });

  if (result.status === "error") {
    return <FindingSeverityOverTimeEmpty message="failedToLoadData" />;
  }

  if (result.status === "empty") {
    return <FindingSeverityOverTimeEmpty message="noDataAvailable" />;
  }

  return <FindingSeverityOverTimeCard data={result.data.data} />;
};
