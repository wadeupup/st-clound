"use client";

import { Chip } from "@heroui/chip";
import { Ban, Check } from "lucide-react";
import { useState } from "react";

import { Button, Card } from "@/components/shadcn";
import { useI18n } from "@/lib/i18n/context";
import { getRolePermissions } from "@/lib/permissions";
import { RoleData, RoleDetail } from "@/types/users";

interface PermissionItemProps {
  enabled: boolean;
  label: string;
}

export const PermissionIcon = ({ enabled }: { enabled: boolean }) => (
  <span
    className={`inline-flex h-4 w-4 items-center justify-center rounded-full ${enabled ? "bg-green-100 text-green-700" : "bg-red-100 text-red-500"}`}
  >
    {enabled ? <Check /> : <Ban />}
  </span>
);

const PermissionItem = ({ enabled, label }: PermissionItemProps) => (
  <div className="flex items-center gap-2 whitespace-nowrap">
    <PermissionIcon enabled={enabled} />
    <span className="text-xs text-slate-700 dark:text-slate-300">{label}</span>
  </div>
);

export const RoleItem = ({
  role,
  roleDetail,
}: {
  role: RoleData;
  roleDetail?: RoleDetail;
}) => {
  const { t } = useI18n();
  const [isExpanded, setIsExpanded] = useState(true);

  if (!roleDetail) {
    return (
      <Chip key={role.id} size="sm" variant="flat" color="primary">
        {role.id}
      </Chip>
    );
  }

  const { attributes } = roleDetail;
  const roleName = attributes?.name || role.id;
  const permissionState = attributes?.permission_state || "";
  const detailsId = `role-details-${role.id}`;

  const permissions = getRolePermissions(attributes, {
    permissions: t.profile.permissions,
  });

  return (
    <Card
      variant="inner"
      className="border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800/50"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Chip size="sm" variant="flat" color="primary">
            {roleName}
          </Chip>
          <span className="text-xs text-slate-600 capitalize dark:text-slate-400">
            {permissionState}
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? t.profile.hideDetails : t.profile.showDetails}
        </Button>
      </div>

      {isExpanded && (
        <div
          id={detailsId}
          className="animate-fadeIn border-t border-slate-200 pt-4 dark:border-slate-700"
          role="region"
          aria-label={`Details for role ${roleName}`}
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-2">
            {permissions.map(({ key, label, enabled }) => (
              <PermissionItem key={key} label={label} enabled={enabled} />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
