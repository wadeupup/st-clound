"use client";

import { Card, CardContent } from "@/components/shadcn";
import { useI18n } from "@/lib/i18n/context";
import { MembershipDetailData, TenantDetailData } from "@/types/users";

import { MembershipItem } from "./membership-item";

export const MembershipsCard = ({
  memberships,
  tenantsMap,
  isOwner,
}: {
  memberships: MembershipDetailData[];
  tenantsMap: Record<string, TenantDetailData>;
  isOwner: boolean;
}) => {
  const { t } = useI18n();

  return (
    <Card
      variant="base"
      padding="none"
      className="rounded-xl border border-slate-200 bg-white/80 p-6 shadow-lg backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80"
    >
      <CardContent>
        <div className="mb-6 flex flex-col gap-1">
          <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {t.profile.organizations}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {t.profile.organizationsAssociated}
          </p>
        </div>
        {memberships.length === 0 ? (
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {t.profile.noMembershipsFound}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {memberships.map((membership) => {
              const tenantId = membership.relationships.tenant.data.id;
              return (
                <MembershipItem
                  key={membership.id}
                  membership={membership}
                  tenantId={tenantId}
                  tenantName={tenantsMap[tenantId]?.attributes.name}
                  isOwner={isOwner}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
