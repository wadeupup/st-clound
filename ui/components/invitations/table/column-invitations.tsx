"use client";

import { ColumnDef } from "@tanstack/react-table";

import { DateWithTime } from "@/components/ui/entities";
import { DataTableColumnHeader } from "@/components/ui/table";
import { useI18n } from "@/lib/i18n/context";
import { InvitationProps } from "@/types";

import { DataTableRowActions } from "./data-table-row-actions";

const getInvitationData = (row: { original: InvitationProps }) => {
  return row.original.attributes;
};

export const ColumnsInvitation: ColumnDef<InvitationProps>[] = [];

export const getColumnsInvitation = (
  t: ReturnType<typeof useI18n>["t"],
): ColumnDef<InvitationProps>[] => {
  return [
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t.invitations.table.email}
        />
      ),
      cell: ({ row }) => {
        const data = getInvitationData(row);
        return (
          <p className="font-semibold">
            {data?.email || t.invitations.table.nA}
          </p>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "state",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t.invitations.table.state}
          param="state"
        />
      ),
      cell: ({ row }) => {
        const { state } = getInvitationData(row);
        return <p className="font-semibold">{state}</p>;
      },
    },
    {
      accessorKey: "role",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t.invitations.table.role}
        />
      ),
      cell: ({ row }) => {
        const roleName =
          row.original.relationships?.role?.attributes?.name ||
          t.invitations.table.noRole;
        return <p className="font-semibold">{roleName}</p>;
      },
      enableSorting: false,
    },
    {
      accessorKey: "inserted_at",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t.invitations.table.insertedAt}
          param="inserted_at"
        />
      ),
      cell: ({ row }) => {
        const { inserted_at } = getInvitationData(row);
        return <DateWithTime dateTime={inserted_at} showTime={false} />;
      },
    },
    {
      accessorKey: "expires_at",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t.invitations.table.expiresAt}
          param="expires_at"
        />
      ),
      cell: ({ row }) => {
        const { expires_at } = getInvitationData(row);
        return <DateWithTime dateTime={expires_at} showTime={false} />;
      },
    },
    {
      accessorKey: "actions",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t.invitations.table.actions}
        />
      ),
      id: "actions",
      cell: ({ row }) => {
        const roles = row.original.roles;
        return <DataTableRowActions row={row} roles={roles} />;
      },
      enableSorting: false,
    },
  ];
};
