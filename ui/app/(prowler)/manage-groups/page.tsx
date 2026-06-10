import { Divider } from "@heroui/divider";
import { Spacer } from "@heroui/spacer";
import { redirect } from "next/navigation";
import React, { Suspense } from "react";

import {
  getProviderGroupInfoById,
  getProviderGroups,
} from "@/actions/manage-groups/manage-groups";
import { getProviders } from "@/actions/providers";
import { getRoles } from "@/actions/roles";
import { FilterControls } from "@/components/filters/filter-controls";
import { AddGroupForm, EditGroupForm } from "@/components/manage-groups/forms";
import { SkeletonManageGroups } from "@/components/manage-groups/skeleton-manage-groups";
import { ColumnGroupsWrapper } from "@/components/manage-groups/table/column-groups-wrapper";
import { ProviderProps, Role, SearchParamsProps } from "@/types";

import { CreateGroupTitle } from "./create-group-title";
import { EditGroupTitle } from "./edit-group-title";
import { GroupNotFound } from "./group-not-found";
import { ManageGroupsPageClient } from "./manage-groups-page-client";

export default async function ManageGroupsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsProps>;
}) {
  const resolvedSearchParams = await searchParams;
  const searchParamsKey = JSON.stringify(resolvedSearchParams);
  const providerGroupId = resolvedSearchParams.groupId;

  return (
    <div className="grid min-h-[70vh] grid-cols-1 items-center justify-center gap-4 md:grid-cols-12">
      <div className="col-span-1 flex justify-end md:col-span-4">
        <Suspense key={searchParamsKey} fallback={<SkeletonManageGroups />}>
          {providerGroupId ? (
            <SSRDataEditGroup searchParams={resolvedSearchParams} />
          ) : (
            <div className="flex flex-col">
              <CreateGroupTitle />
              <SSRAddGroupForm />
            </div>
          )}
        </Suspense>
      </div>

      <Divider orientation="vertical" className="mx-auto h-full" />

      <div className="col-span-1 flex-col justify-start md:col-span-6">
        <FilterControls />
        <Spacer y={8} />
        <ManageGroupsPageClient />
        <Suspense key={searchParamsKey} fallback={<SkeletonManageGroups />}>
          <SSRDataTable searchParams={resolvedSearchParams} />
        </Suspense>
      </div>
    </div>
  );
}

const SSRAddGroupForm = async () => {
  const providersResponse = await getProviders({ pageSize: 50 });
  const rolesResponse = await getRoles({});

  const providersData =
    providersResponse?.data?.map((provider: ProviderProps) => ({
      id: provider.id,
      name: provider.attributes.alias || provider.attributes.uid,
    })) || [];

  const rolesData =
    rolesResponse?.data?.map((role: Role) => ({
      id: role.id,
      name: role.attributes.name,
    })) || [];

  return <AddGroupForm providers={providersData} roles={rolesData} />;
};

const SSRDataEditGroup = async ({
  searchParams,
}: {
  searchParams: SearchParamsProps;
}) => {
  const providerGroupId = searchParams.groupId;

  // Redirect if no group ID is provided or if the parameter is invalid
  if (!providerGroupId || Array.isArray(providerGroupId)) {
    redirect("/manage-groups");
  }

  // Fetch the provider group details
  const providerGroupData = await getProviderGroupInfoById(providerGroupId);

  if (!providerGroupData || providerGroupData.error) {
    return (
      <div>
        <EditGroupTitle />
        <GroupNotFound />
      </div>
    );
  }

  const providersResponse = await getProviders({ pageSize: 50 });
  const rolesResponse = await getRoles({});

  const providersList =
    providersResponse?.data?.map((provider: ProviderProps) => ({
      id: provider.id,
      name: provider.attributes.alias || provider.attributes.uid,
    })) || [];

  const rolesList =
    rolesResponse?.data?.map((role: Role) => ({
      id: role.id,
      name: role.attributes.name,
    })) || [];

  const { attributes, relationships } = providerGroupData.data;

  const associatedProviders = relationships.providers?.data.map(
    (provider: ProviderProps) => {
      const matchingProvider = providersList.find(
        (p: { id: string; name: string }) => p.id === provider.id,
      );
      return {
        id: provider.id,
        name: matchingProvider?.name || "",
      };
    },
  );

  const associatedRoles = relationships.roles?.data.map((role: Role) => {
    const matchingRole = rolesList.find((r: Role) => r.id === role.id);
    return {
      id: role.id,
      name: matchingRole?.name || "",
    };
  });

  const formData = {
    name: attributes.name,
    providers: associatedProviders,
    roles: associatedRoles,
  };

  return (
    <div className="flex flex-col">
      <EditGroupTitle />
      <EditGroupForm
        providerGroupId={providerGroupId}
        providerGroupData={formData}
        allProviders={providersList}
        allRoles={rolesList}
      />
    </div>
  );
};

const SSRDataTable = async ({
  searchParams,
}: {
  searchParams: SearchParamsProps;
}) => {
  const page = parseInt(searchParams.page?.toString() || "1", 10);
  const sort = searchParams.sort?.toString();
  const pageSize = parseInt(searchParams.pageSize?.toString() || "10", 10);

  // Convert filters to the correct type
  const filters: Record<string, string> = {};
  Object.entries(searchParams)
    .filter(([key]) => key.startsWith("filter["))
    .forEach(([key, value]) => {
      filters[key] = value?.toString() || "";
    });

  const query = (filters["filter[search]"] as string) || "";
  const providerGroupsData = await getProviderGroups({
    query,
    page,
    sort,
    filters,
    pageSize,
  });

  return (
    <>
      <ColumnGroupsWrapper
        data={providerGroupsData?.data || []}
        metadata={providerGroupsData?.meta}
      />
    </>
  );
};
