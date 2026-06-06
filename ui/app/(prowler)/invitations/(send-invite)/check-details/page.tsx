import { Suspense } from "react";

import { getInvitationInfoById } from "@/actions/invitations/invitation";
import { InvitationDetails } from "@/components/invitations";
import { SkeletonInvitationInfo } from "@/components/invitations/workflow";
import { SearchParamsProps } from "@/types";
import { ErrorDisplay } from "./error-display";

export default async function CheckDetailsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsProps>;
}) {
  const resolvedSearchParams = await searchParams;
  const searchParamsKey = JSON.stringify(resolvedSearchParams || {});

  return (
    <Suspense key={searchParamsKey} fallback={<SkeletonInvitationInfo />}>
      <SSRDataInvitation searchParams={resolvedSearchParams} />
    </Suspense>
  );
}

const SSRDataInvitation = async ({
  searchParams,
}: {
  searchParams: SearchParamsProps;
}) => {
  const invitationId = searchParams.id;

  if (!invitationId) {
    return <ErrorDisplay type="invalidId" />;
  }

  const invitationData = (await getInvitationInfoById(invitationId as string))
    .data;

  if (!invitationData) {
    return <ErrorDisplay type="notFound" />;
  }

  const { attributes, links } = invitationData;

  return <InvitationDetails attributes={attributes} selfLink={links.self} />;
};
