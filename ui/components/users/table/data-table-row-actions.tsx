"use client";

import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
} from "@heroui/dropdown";
import {
  DeleteDocumentBulkIcon,
  EditDocumentBulkIcon,
} from "@heroui/shared-icons";
import { Row } from "@tanstack/react-table";
import clsx from "clsx";
import { useState } from "react";

import { VerticalDotsIcon } from "@/components/icons";
import { Button } from "@/components/shadcn";
import { CustomAlertModal } from "@/components/ui/custom";
import { useI18n } from "@/lib/i18n/context";

import { DeleteForm, EditForm } from "../forms";

interface DataTableRowActionsProps<UserProps> {
  row: Row<UserProps>;
  roles?: { id: string; name: string }[];
}
const iconClasses = "text-2xl text-default-500 pointer-events-none shrink-0";

export function DataTableRowActions<UserProps>({
  row,
  roles,
}: DataTableRowActionsProps<UserProps>) {
  const { t } = useI18n();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const userId = (row.original as { id: string }).id;
  const userName = (row.original as any).attributes?.name;
  const userEmail = (row.original as any).attributes?.email;
  const userCompanyName = (row.original as any).attributes?.company_name;
  const userRole = (row.original as any).attributes?.role?.name;

  return (
    <>
      <CustomAlertModal
        isOpen={isEditOpen}
        onOpenChange={setIsEditOpen}
        title={t.users.editModal.title}
      >
        <EditForm
          userId={userId}
          userName={userName}
          userEmail={userEmail}
          userCompanyName={userCompanyName}
          currentRole={userRole}
          roles={roles || []}
          setIsOpen={setIsEditOpen}
        />
      </CustomAlertModal>
      <CustomAlertModal
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title={t.users.deleteModal.title}
        description={t.users.deleteModal.description}
      >
        <DeleteForm userId={userId} setIsOpen={setIsDeleteOpen} />
      </CustomAlertModal>

      <div className="relative flex items-center justify-end gap-2">
        <Dropdown
          className="border-border-neutral-secondary bg-bg-neutral-secondary border shadow-xl"
          placement="bottom"
        >
          <DropdownTrigger>
            <Button variant="ghost" size="icon-sm" className="rounded-full">
              <VerticalDotsIcon className="text-slate-400" />
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            closeOnSelect
            aria-label={t.users.rowActions.actions}
            color="default"
            variant="flat"
          >
            <DropdownSection title={t.users.rowActions.actions}>
              <DropdownItem
                key="edit"
                description={t.users.rowActions.editUserDescription}
                textValue={t.users.rowActions.editUser}
                startContent={<EditDocumentBulkIcon className={iconClasses} />}
                onPress={() => setIsEditOpen(true)}
              >
                {t.users.rowActions.editUser}
              </DropdownItem>
            </DropdownSection>
            <DropdownSection title={t.users.rowActions.dangerZone}>
              <DropdownItem
                key="delete"
                className="text-text-error"
                color="danger"
                description={t.users.rowActions.deleteUserDescription}
                textValue={t.users.rowActions.deleteUser}
                startContent={
                  <DeleteDocumentBulkIcon
                    className={clsx(iconClasses, "!text-text-error")}
                  />
                }
                onPress={() => setIsDeleteOpen(true)}
              >
                {t.users.rowActions.deleteUser}
              </DropdownItem>
            </DropdownSection>
          </DropdownMenu>
        </Dropdown>
      </div>
    </>
  );
}
