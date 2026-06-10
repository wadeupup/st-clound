"use client";

import { ColumnDef } from "@tanstack/react-table";

import { DateWithTime } from "@/components/ui/entities";
import { DataTableColumnHeader } from "@/components/ui/table";
import { useI18n } from "@/lib/i18n/context";
import { UserProps } from "@/types";

import { DataTableRowActions } from "./data-table-row-actions";

const getUserData = (row: { original: UserProps }) => {
  return row.original.attributes;
};

export const ColumnsUser: ColumnDef<UserProps>[] = [];

export const getColumnsUser = (
  t: ReturnType<typeof useI18n>["t"],
): ColumnDef<UserProps>[] => {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t.users.table.name}
          param="name"
        />
      ),
      cell: ({ row }) => {
        const data = getUserData(row);
        return (
          <p className="font-semibold">{data?.name || t.users.table.nA}</p>
        );
      },
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t.users.table.email}
          param="email"
        />
      ),
      cell: ({ row }) => {
        const { email } = getUserData(row);
        return <p className="font-semibold">{email}</p>;
      },
    },
    {
      accessorKey: "role",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.users.table.role} />
      ),
      cell: ({ row }) => {
        const { role } = getUserData(row);
        return (
          <p className="font-semibold">{role?.name || t.users.table.noRole}</p>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "company_name",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t.users.table.companyName}
          param="company_name"
        />
      ),
      cell: ({ row }) => {
        const { company_name } = getUserData(row);
        return <p className="font-semibold">{company_name}</p>;
      },
    },
    {
      accessorKey: "date_joined",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t.users.table.joined}
          param="date_joined"
        />
      ),
      cell: ({ row }) => {
        const { date_joined } = getUserData(row);
        return <DateWithTime dateTime={date_joined} showTime={false} />;
      },
    },
    {
      accessorKey: "actions",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t.users.table.actions} />
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
