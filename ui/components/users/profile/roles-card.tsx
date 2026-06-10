"use client";

import { Card, CardContent } from "@/components/shadcn";
import { useI18n } from "@/lib/i18n/context";
import { RoleData, RoleDetail } from "@/types/users";

import { RoleItem } from "./role-item";

export const RolesCard = ({
  roles,
  roleDetails,
}: {
  roles: RoleData[];
  roleDetails: Record<string, RoleDetail>;
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
            {t.profile.activeRoles}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {t.profile.rolesAssigned}
          </p>
        </div>
        {roles.length === 0 ? (
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {t.profile.noRolesAssigned}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {roles.map((role) => (
              <RoleItem
                key={role.id}
                role={role}
                roleDetail={roleDetails[role.id]}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
