"use server";

import { getLatestFindings } from "@/actions/findings/findings";
import { createDict } from "@/lib/helper";
import { mapProviderFiltersForFindingsObject } from "@/lib/provider-helpers";
import { FindingProps, SearchParamsProps } from "@/types";

import { pickFilterParams } from "../../_lib/filter-params";
import { FindingsViewClient } from "./findings-view-client";

interface FindingsViewSSRProps {
  searchParams: SearchParamsProps;
}

export async function FindingsViewSSR({ searchParams }: FindingsViewSSRProps) {
  const page = 1;
  const sort = "severity,-inserted_at";

  const defaultFilters = {
    "filter[status]": "FAIL",
    "filter[delta]": "new",
  };

  const filters = pickFilterParams(searchParams);
  const mappedFilters = mapProviderFiltersForFindingsObject(filters);
  const combinedFilters = { ...defaultFilters, ...mappedFilters };

  const findingsData = await getLatestFindings({
    query: undefined,
    page,
    sort,
    filters: combinedFilters,
  });

  const resourceDict = createDict("resources", findingsData);
  const scanDict = createDict("scans", findingsData);
  const providerDict = createDict("providers", findingsData);

  const expandedFindings = findingsData?.data
    ? (findingsData.data as FindingProps[]).map((finding) => {
        const scan = scanDict[finding.relationships?.scan?.data?.id];
        const resource =
          resourceDict[finding.relationships?.resources?.data?.[0]?.id];
        const provider = providerDict[scan?.relationships?.provider?.data?.id];

        return {
          ...finding,
          relationships: { scan, resource, provider },
        };
      })
    : [];

  return <FindingsViewClient data={(expandedFindings || []) as FindingProps[]} />;
}
