import { Spacer } from "@heroui/spacer";
import { Suspense } from "react";

import {
  getLatestMetadataInfo,
  getLatestResources,
  getMetadataInfo,
  getResources,
} from "@/actions/resources";
import { FilterControls } from "@/components/filters";
import { SkeletonTableResources } from "@/components/resources/skeleton/skeleton-table-resources";
import { ContentLayout } from "@/components/ui";
import {
  createDict,
  extractFiltersAndQuery,
  extractSortAndKey,
  hasDateOrScanFilter,
  replaceFieldKey,
} from "@/lib";
import { ResourceProps, SearchParamsProps } from "@/types";

import { ErrorDisplay } from "./error-display";
import { ResourcesFilters } from "./resources-filters";
import { ResourcesTable } from "./resources-table";
import { ResourcesTitle } from "./resources-title";

export default async function Resources({
  searchParams,
}: {
  searchParams: Promise<SearchParamsProps>;
}) {
  const resolvedSearchParams = await searchParams;
  const { searchParamsKey, encodedSort } =
    extractSortAndKey(resolvedSearchParams);
  const { filters, query } = extractFiltersAndQuery(resolvedSearchParams);
  const outputFilters = replaceFieldKey(filters, "inserted_at", "updated_at");

  // Check if the searchParams contain any date or scan filter
  const hasDateOrScan = hasDateOrScanFilter(resolvedSearchParams);

  const metadataInfoData = await (
    hasDateOrScan ? getMetadataInfo : getLatestMetadataInfo
  )({
    query,
    filters: outputFilters,
    sort: encodedSort,
  });

  // Extract unique regions, services, types, and names from the metadata endpoint
  const uniqueRegions = metadataInfoData?.data?.attributes?.regions || [];
  const uniqueServices = metadataInfoData?.data?.attributes?.services || [];
  const uniqueResourceTypes = metadataInfoData?.data?.attributes?.types || [];

  return (
    <ContentLayout title={<ResourcesTitle />} icon="lucide:warehouse">
      <FilterControls search date />
      <ResourcesFilters
        uniqueRegions={uniqueRegions}
        uniqueResourceTypes={uniqueResourceTypes}
        uniqueServices={uniqueServices}
      />
      <Spacer y={8} />
      <Suspense key={searchParamsKey} fallback={<SkeletonTableResources />}>
        <SSRDataTable searchParams={resolvedSearchParams} />
      </Suspense>
    </ContentLayout>
  );
}

const SSRDataTable = async ({
  searchParams,
}: {
  searchParams: SearchParamsProps;
}) => {
  const page = parseInt(searchParams.page?.toString() || "1", 10);
  const pageSize = parseInt(searchParams.pageSize?.toString() || "10", 10);
  const { encodedSort } = extractSortAndKey({
    ...searchParams,
    ...(searchParams.sort && { sort: searchParams.sort }),
  });

  const { filters, query } = extractFiltersAndQuery(searchParams);
  // Check if the searchParams contain any date or scan filter
  const hasDateOrScan = hasDateOrScanFilter(searchParams);

  const outputFilters = replaceFieldKey(filters, "inserted_at", "updated_at");

  const fetchResources = hasDateOrScan ? getResources : getLatestResources;

  const resourcesData = await fetchResources({
    query,
    page,
    sort: encodedSort,
    filters: outputFilters,
    pageSize,
    include: "provider",
    fields: [
      "name",
      "failed_findings_count",
      "region",
      "service",
      "type",
      "provider",
      "inserted_at",
      "updated_at",
      "uid",
      "partition",
      "details",
      "metadata",
    ],
  });

  // Create dictionary for providers (removed findings dict since we're not including findings anymore)
  const providerDict = createDict("providers", resourcesData);

  // Expand each resource with its corresponding provider (removed findings expansion)
  const expandedResources = resourcesData?.data
    ? resourcesData.data.map((resource: ResourceProps) => {
        const provider = {
          data: providerDict[resource.relationships.provider.data.id],
        };

        return {
          ...resource,
          relationships: {
            ...resource.relationships,
            provider,
          },
        };
      })
    : [];

  return (
    <>
      {resourcesData?.errors && (
        <ErrorDisplay error={resourcesData.errors[0].detail} />
      )}
      <ResourcesTable
        data={expandedResources || []}
        metadata={resourcesData?.meta}
      />
    </>
  );
};
