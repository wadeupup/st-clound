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
import { useRouter } from "next/navigation";
import { useState } from "react";

import { VerticalDotsIcon } from "@/components/icons";
import { Button } from "@/components/shadcn";
import { CustomAlertModal } from "@/components/ui/custom/custom-alert-modal";
import { useI18n } from "@/lib/i18n/context";

import { DeleteRoleForm } from "../workflow/forms";
interface DataTableRowActionsProps<RoleProps> {
  row: Row<RoleProps>;
}
const iconClasses = "text-2xl text-default-500 pointer-events-none shrink-0";

export function DataTableRowActions<RoleProps>({
  row,
}: DataTableRowActionsProps<RoleProps>) {
  const { t } = useI18n();
  const router = useRouter();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const roleId = (row.original as { id: string }).id;
  return (
    <>
      <CustomAlertModal
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title={t.roles.deleteModal.title}
        description={t.roles.deleteModal.description}
      >
        <DeleteRoleForm roleId={roleId} setIsOpen={setIsDeleteOpen} />
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
            aria-label={t.roles.rowActions.actions}
            color="default"
            variant="flat"
          >
            <DropdownSection title={t.roles.rowActions.actions}>
              <DropdownItem
                key="edit"
                description={t.roles.rowActions.editRoleDescription}
                textValue={t.roles.rowActions.editRole}
                startContent={<EditDocumentBulkIcon className={iconClasses} />}
                onPress={() => router.push(`/roles/edit?roleId=${roleId}`)}
              >
                {t.roles.rowActions.editRole}
              </DropdownItem>
            </DropdownSection>
            <DropdownSection title={t.roles.rowActions.dangerZone}>
              <DropdownItem
                key="delete"
                className="text-text-error"
                color="danger"
                description={t.roles.rowActions.deleteRoleDescription}
                textValue={t.roles.rowActions.deleteRole}
                startContent={
                  <DeleteDocumentBulkIcon
                    className={clsx(iconClasses, "!text-text-error")}
                  />
                }
                onPress={() => setIsDeleteOpen(true)}
              >
                {t.roles.rowActions.deleteRole}
              </DropdownItem>
            </DropdownSection>
          </DropdownMenu>
        </Dropdown>
      </div>
    </>
  );
}
