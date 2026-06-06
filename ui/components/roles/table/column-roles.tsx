"use client";

import { ColumnDef } from "@tanstack/react-table";

import { DateWithTime } from "@/components/ui/entities";
import { DataTableColumnHeader } from "@/components/ui/table";
import { useI18n } from "@/lib/i18n/context";
import { RolesProps } from "@/types";

import { DataTableRowActions } from "./data-table-row-actions";

const getRoleAttributes = (row: { original: RolesProps["data"][number] }) => {
  return row.original.attributes;
};

const getRoleRelationships = (row: {
  original: RolesProps["data"][number];
}) => {
  return row.original.relationships;
};

export const ColumnsRoles: ColumnDef<RolesProps["data"][number]>[] = [];

export const getColumnsRoles = (
  t: ReturnType<typeof useI18n>["t"],
): ColumnDef<RolesProps["data"][number]>[] => {
  return [
    {
      accessorKey: "role",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.roles.table.role} param="name" />
      ),
      cell: ({ row }) => {
        const data = getRoleAttributes(row);
        return <p className="font-semibold">{data.name}</p>;
      },
    },
    {
      accessorKey: "users",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.roles.table.users} param="users" />
      ),
      cell: ({ row }) => {
        const relationships = getRoleRelationships(row);
        const count = relationships.users.meta.count;
        return (
          <p className="text-xs font-semibold">
            {count === 0
              ? t.roles.table.noUsers
              : `${count} ${count === 1 ? t.roles.table.user : t.roles.table.users}`}
          </p>
        );
      },
    },
    {
      accessorKey: "invitations",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t.roles.table.invitations}
          param="invitations"
        />
      ),
      cell: ({ row }) => {
        const relationships = getRoleRelationships(row);
        const count = relationships.invitations.meta.count;
        return (
          <p className="text-xs font-semibold">
            {count === 0
              ? t.roles.table.noInvitations
              : `${count} ${count === 1 ? t.roles.table.invitation : t.roles.table.invitations}`}
          </p>
        );
      },
    },
    {
      accessorKey: "permission_state",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t.roles.table.permissions}
          param="permission_state"
        />
      ),
      cell: ({ row }) => {
        const { permission_state } = getRoleAttributes(row);
        const permissionMap: Record<string, string> = {
          unlimited: t.roles.filters.unlimited,
          limited: t.roles.filters.limited,
          none: t.roles.filters.none,
        };
        return (
          <p className="text-xs font-semibold">
            {permissionMap[permission_state] || permission_state}
          </p>
        );
      },
    },
    {
      accessorKey: "inserted_at",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t.roles.table.added}
          param="inserted_at"
        />
      ),
      cell: ({ row }) => {
        const { inserted_at } = getRoleAttributes(row);
        return <DateWithTime dateTime={inserted_at} showTime={false} />;
      },
    },
    {
      accessorKey: "actions",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.roles.table.actions} />
      ),
      id: "actions",
      cell: ({ row }) => {
        return <DataTableRowActions row={row} />;
      },
      enableSorting: false,
    },
  ];
};
