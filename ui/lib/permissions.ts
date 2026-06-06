import { RolePermissionAttributes } from "@/types/users";

export const isUserOwnerAndHasManageAccount = (
  roles: any[],
  memberships: any[],
  userId: string,
): boolean => {
  const isOwner = memberships.some(
    (membership) =>
      membership.attributes.role === "owner" &&
      membership.relationships?.user?.data?.id === userId,
  );

  const hasManageAccount = roles.some(
    (role) =>
      role.attributes.manage_account === true &&
      role.relationships?.users?.data?.some((user: any) => user.id === userId),
  );

  return isOwner && hasManageAccount;
};

/**
 * Get the permissions for a user role
 * @param attributes - The attributes of the user role
 * @param t - Translation function (optional)
 * @returns The permissions for the user role
 */
export const getRolePermissions = (
  attributes: RolePermissionAttributes,
  t?: {
    permissions: {
      manageUsers: string;
      manageAccount: string;
      manageProviders: string;
      manageScans: string;
      manageIntegrations: string;
      unlimitedVisibility: string;
    };
  },
) => {
  const permissions = [
    {
      key: "manage_users",
      label: t?.permissions.manageUsers ?? "Manage Users",
      enabled: attributes.manage_users,
    },
    {
      key: "manage_account",
      label: t?.permissions.manageAccount ?? "Manage Account",
      enabled: attributes.manage_account,
    },
    {
      key: "manage_providers",
      label: t?.permissions.manageProviders ?? "Manage Providers",
      enabled: attributes.manage_providers,
    },
    {
      key: "manage_scans",
      label: t?.permissions.manageScans ?? "Manage Scans",
      enabled: attributes.manage_scans,
    },
    {
      key: "unlimited_visibility",
      label: t?.permissions.unlimitedVisibility ?? "Unlimited Visibility",
      enabled: attributes.unlimited_visibility,
    },
  ];

  return permissions;
};
