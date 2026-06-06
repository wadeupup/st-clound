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
import { CustomAlertModal } from "@/components/ui/custom";
import { useI18n } from "@/lib/i18n/context";

import { DeleteGroupForm } from "../forms";

interface DataTableRowActionsProps<ProviderProps> {
  row: Row<ProviderProps>;
}
const iconClasses = "text-2xl text-default-500 pointer-events-none shrink-0";

export function DataTableRowActions<ProviderProps>({
  row,
}: DataTableRowActionsProps<ProviderProps>) {
  const { t } = useI18n();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const groupId = (row.original as { id: string }).id;

  const router = useRouter();

  return (
    <>
      <CustomAlertModal
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title={t.providers.providerGroups.rowActions.deleteConfirmTitle}
        description={t.providers.providerGroups.rowActions.deleteConfirmDescription}
      >
        <DeleteGroupForm groupId={groupId} setIsOpen={setIsDeleteOpen} />
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
            aria-label={t.providers.providerGroups.rowActions.actions}
            color="default"
            variant="flat"
          >
            <DropdownSection title={t.providers.providerGroups.rowActions.actions}>
              <DropdownItem
                key="edit"
                description={t.providers.providerGroups.rowActions.editProviderGroupDescription}
                textValue={t.providers.providerGroups.rowActions.editProviderGroup}
                startContent={<EditDocumentBulkIcon className={iconClasses} />}
                onPress={() => router.push(`/manage-groups?groupId=${groupId}`)}
              >
                {t.providers.providerGroups.rowActions.editProviderGroup}
              </DropdownItem>
            </DropdownSection>
            <DropdownSection title={t.providers.providerGroups.rowActions.dangerZone}>
              <DropdownItem
                key="delete"
                className="text-text-error"
                color="danger"
                description={t.providers.providerGroups.rowActions.deleteProviderGroupDescription}
                textValue={t.providers.providerGroups.rowActions.deleteProviderGroup}
                startContent={
                  <DeleteDocumentBulkIcon
                    className={clsx(iconClasses, "!text-text-error")}
                  />
                }
                onPress={() => setIsDeleteOpen(true)}
              >
                {t.providers.providerGroups.rowActions.deleteProviderGroup}
              </DropdownItem>
            </DropdownSection>
          </DropdownMenu>
        </Dropdown>
      </div>
    </>
  );
}
