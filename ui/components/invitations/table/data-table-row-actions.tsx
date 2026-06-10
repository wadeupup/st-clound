"use client";

import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
} from "@heroui/dropdown";
import {
  AddNoteBulkIcon,
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

import { DeleteForm, EditForm } from "../forms";

interface DataTableRowActionsProps<InvitationProps> {
  row: Row<InvitationProps>;
  roles?: { id: string; name: string }[];
}
const iconClasses = "text-2xl text-default-500 pointer-events-none shrink-0";

export function DataTableRowActions<InvitationProps>({
  row,
  roles,
}: DataTableRowActionsProps<InvitationProps>) {
  const { t } = useI18n();
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const invitationId = (row.original as { id: string }).id;
  const invitationEmail = (row.original as any).attributes?.email;
  const invitationRole = (row.original as any).relationships?.role?.attributes
    ?.name;
  const invitationAccepted = (row.original as any).attributes?.state;

  return (
    <>
      <CustomAlertModal
        isOpen={isEditOpen}
        onOpenChange={setIsEditOpen}
        title={t.invitations.editModal.title}
      >
        <EditForm
          invitationId={invitationId}
          invitationEmail={invitationEmail}
          currentRole={invitationRole}
          roles={roles || []}
          setIsOpen={setIsEditOpen}
        />
      </CustomAlertModal>
      <CustomAlertModal
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title={t.invitations.deleteModal.title}
        description={t.invitations.deleteModal.description}
      >
        <DeleteForm invitationId={invitationId} setIsOpen={setIsDeleteOpen} />
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
            aria-label={t.invitations.rowActions.actions}
            color="default"
            variant="flat"
          >
            <DropdownSection title={t.invitations.rowActions.actions}>
              <DropdownItem
                key="check-details"
                description={t.invitations.rowActions.checkDetailsDescription}
                textValue={t.invitations.rowActions.checkDetails}
                startContent={<AddNoteBulkIcon className={iconClasses} />}
                onPress={() =>
                  router.push(`/invitations/check-details?id=${invitationId}`)
                }
              >
                {t.invitations.rowActions.checkDetails}
              </DropdownItem>

              <DropdownItem
                key="edit"
                description={t.invitations.rowActions.editInvitationDescription}
                textValue={t.invitations.rowActions.editInvitation}
                startContent={<EditDocumentBulkIcon className={iconClasses} />}
                onPress={() => setIsEditOpen(true)}
                isDisabled={invitationAccepted === "accepted"}
              >
                {t.invitations.rowActions.editInvitation}
              </DropdownItem>
            </DropdownSection>
            <DropdownSection title={t.invitations.rowActions.dangerZone}>
              <DropdownItem
                key="delete"
                className="text-text-error"
                color="danger"
                description={
                  t.invitations.rowActions.revokeInvitationDescription
                }
                textValue={t.invitations.rowActions.revokeInvitation}
                startContent={
                  <DeleteDocumentBulkIcon
                    className={clsx(iconClasses, "!text-text-error")}
                  />
                }
                onPress={() => setIsDeleteOpen(true)}
                isDisabled={invitationAccepted === "accepted"}
              >
                {t.invitations.rowActions.revokeInvitation}
              </DropdownItem>
            </DropdownSection>
          </DropdownMenu>
        </Dropdown>
      </div>
    </>
  );
}
