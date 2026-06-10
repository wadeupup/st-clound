import { Spacer } from "@heroui/spacer";
import React, { Suspense } from "react";

import { getInvitations } from "@/actions/invitations/invitation";
import { getRoles } from "@/actions/roles";
import { FilterControls } from "@/components/filters";
import { SkeletonTableInvitation } from "@/components/invitations/table";
import { ContentLayout } from "@/components/ui";
import { InvitationProps, Role, SearchParamsProps } from "@/types";

import { InvitationsFilters } from "./invitations-filters";
import { InvitationsInviteButton } from "./invitations-invite-button";
import { InvitationsTable } from "./invitations-table";
import { InvitationsTitle } from "./invitations-title";

export default async function Invitations({
  searchParams,
}: {
  searchParams: Promise<SearchParamsProps>;
}) {
  const resolvedSearchParams = await searchParams;
  const searchParamsKey = JSON.stringify(resolvedSearchParams || {});

  return (
    <ContentLayout title={<InvitationsTitle />} icon="lucide:mail">
      <FilterControls search />

      <div className="flex flex-row items-center justify-between">
        <InvitationsFilters />

        <InvitationsInviteButton />
      </div>
      <Spacer y={8} />

      <Suspense key={searchParamsKey} fallback={<SkeletonTableInvitation />}>
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
  const sort = searchParams.sort?.toString();
  const pageSize = parseInt(searchParams.pageSize?.toString() || "10", 10);

  // Extract all filter parameters
  const filters = Object.fromEntries(
    Object.entries(searchParams).filter(([key]) => key.startsWith("filter[")),
  );

  // Extract query from filters
  const query = (filters["filter[search]"] as string) || "";

  // Fetch invitations and roles
  const invitationsData = await getInvitations({
    query,
    page,
    sort,
    filters,
    pageSize,
  });
  const rolesData = await getRoles({});

  // Handle case where invitationsData is undefined
  if (!invitationsData) {
    return <InvitationsTable data={[]} metadata={undefined} />;
  }

  // Create a dictionary for roles by invitation ID
  const roleDict = (rolesData?.data || []).reduce(
    (acc: Record<string, Role>, role: Role) => {
      role.relationships.invitations.data.forEach((invitation: any) => {
        acc[invitation.id] = role;
      });
      return acc;
    },
    {},
  );

  // Generate the array of roles with all the roles available
  const roles = Array.from(
    new Map(
      (rolesData?.data || []).map((role: Role) => [
        role.id,
        { id: role.id, name: role.attributes?.name || "" },
      ]),
    ).values(),
  );

  // Expand the invitations
  const expandedInvitations =
    invitationsData?.data?.map((invitation: InvitationProps) => {
      const role = roleDict[invitation.id];

      return {
        ...invitation,
        relationships: {
          ...invitation.relationships,
          role,
        },
        roles, // Include all roles here for each invitation
      };
    }) || [];

  // Create the expanded response
  const expandedResponse = {
    ...invitationsData,
    data: expandedInvitations,
    roles,
  };

  return (
    <InvitationsTable
      data={expandedResponse?.data || []}
      metadata={invitationsData?.meta}
    />
  );
};
