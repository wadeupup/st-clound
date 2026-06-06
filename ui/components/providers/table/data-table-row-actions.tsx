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

import { checkConnectionProvider } from "@/actions/providers/providers";
import { VerticalDotsIcon } from "@/components/icons";
import { Button } from "@/components/shadcn";
import { CustomAlertModal } from "@/components/ui/custom";
import { useI18n } from "@/lib/i18n/context";

import { EditForm } from "../forms";
import { DeleteForm } from "../forms/delete-form";

interface DataTableRowActionsProps<ProviderProps> {
  row: Row<ProviderProps>;
}
const iconClasses = "text-2xl text-default-500 pointer-events-none shrink-0";

export function DataTableRowActions<ProviderProps>({
  row,
}: DataTableRowActionsProps<ProviderProps>) {
  const router = useRouter();
  const { t } = useI18n();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const providerId = (row.original as { id: string }).id;
  const providerType = (row.original as any).attributes?.provider;
  const providerAlias = (row.original as any).attributes?.alias;
  const providerSecretId =
    (row.original as any).relationships?.secret?.data?.id || null;

  const handleTestConnection = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append("providerId", providerId);
    await checkConnectionProvider(formData);
    setLoading(false);
  };

  const hasSecret = (row.original as any).relationships?.secret?.data;

  // Calculate disabled keys based on conditions
  const disabledKeys = [];
  if (!hasSecret || loading) {
    disabledKeys.push("new");
  }

  return (
    <>
      <CustomAlertModal
        isOpen={isEditOpen}
        onOpenChange={setIsEditOpen}
        title={t.providers.rowActions.editProviderAliasTitle}
      >
        <EditForm
          providerId={providerId}
          providerAlias={providerAlias}
          setIsOpen={setIsEditOpen}
        />
      </CustomAlertModal>
      <CustomAlertModal
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title={t.providers.rowActions.deleteConfirmTitle}
        description={t.providers.rowActions.deleteConfirmDescription}
      >
        <DeleteForm providerId={providerId} setIsOpen={setIsDeleteOpen} />
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
            aria-label={t.providers.rowActions.actions}
            color="default"
            variant="flat"
            disabledKeys={disabledKeys}
            closeOnSelect={false}
          >
            <DropdownSection title={t.providers.rowActions.actions}>
              <DropdownItem
                key={hasSecret ? "update" : "add"}
                description={
                  hasSecret
                    ? t.providers.rowActions.updateCredentialsDescription
                    : t.providers.rowActions.addCredentialsDescription
                }
                textValue={
                  hasSecret
                    ? t.providers.rowActions.updateCredentials
                    : t.providers.rowActions.addCredentials
                }
                startContent={<EditDocumentBulkIcon className={iconClasses} />}
                onPress={() =>
                  router.push(
                    `/providers/${hasSecret ? "update" : "add"}-credentials?type=${providerType}&id=${providerId}${providerSecretId ? `&secretId=${providerSecretId}` : ""}`,
                  )
                }
                closeOnSelect={true}
              >
                {hasSecret
                  ? t.providers.rowActions.updateCredentials
                  : t.providers.rowActions.addCredentials}
              </DropdownItem>
              <DropdownItem
                key="new"
                description={
                  hasSecret && !loading
                    ? t.providers.rowActions.checkConnectionDescription
                    : loading
                      ? t.providers.rowActions.checkingConnection
                      : t.providers.rowActions.addCredentialsToTest
                }
                textValue={t.providers.rowActions.checkConnection}
                startContent={<AddNoteBulkIcon className={iconClasses} />}
                onPress={handleTestConnection}
                closeOnSelect={false}
              >
                {loading
                  ? t.providers.rowActions.testing
                  : t.providers.rowActions.testConnection}
              </DropdownItem>
              <DropdownItem
                key="edit"
                description={t.providers.rowActions.editProviderDescription}
                textValue={t.providers.rowActions.editProviderAlias}
                startContent={<EditDocumentBulkIcon className={iconClasses} />}
                onPress={() => setIsEditOpen(true)}
                closeOnSelect={true}
              >
                {t.providers.rowActions.editProviderAlias}
              </DropdownItem>
            </DropdownSection>
            <DropdownSection title={t.providers.rowActions.dangerZone}>
              <DropdownItem
                key="delete"
                className="text-text-error"
                color="danger"
                description={t.providers.rowActions.deleteProviderDescription}
                textValue={t.providers.rowActions.deleteProvider}
                startContent={
                  <DeleteDocumentBulkIcon
                    className={clsx(iconClasses, "!text-text-error")}
                  />
                }
                onPress={() => setIsDeleteOpen(true)}
                closeOnSelect={true}
              >
                {t.providers.rowActions.deleteProvider}
              </DropdownItem>
            </DropdownSection>
          </DropdownMenu>
        </Dropdown>
      </div>
    </>
  );
}
