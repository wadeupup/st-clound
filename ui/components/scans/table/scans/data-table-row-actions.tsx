"use client";

import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
} from "@heroui/dropdown";
import {
  // DeleteDocumentBulkIcon,
  EditDocumentBulkIcon,
} from "@heroui/shared-icons";
import { Row } from "@tanstack/react-table";
import { DownloadIcon } from "lucide-react";
import { useState } from "react";

import { VerticalDotsIcon } from "@/components/icons";
import { Button } from "@/components/shadcn";
import { useToast } from "@/components/ui";
import { CustomAlertModal } from "@/components/ui/custom";
import { useI18n } from "@/lib/i18n/context";
import { downloadScanZip } from "@/lib/helper";

import { EditScanForm } from "../../forms";

interface DataTableRowActionsProps<ScanProps> {
  row: Row<ScanProps>;
}
const iconClasses = "text-2xl text-default-500 pointer-events-none shrink-0";

export function DataTableRowActions<ScanProps>({
  row,
}: DataTableRowActionsProps<ScanProps>) {
  const { toast } = useToast();
  const { t } = useI18n();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const scanId = (row.original as { id: string }).id;
  const scanName = (row.original as any).attributes?.name;
  const scanState = (row.original as any).attributes?.state;

  return (
    <>
      <CustomAlertModal
        isOpen={isEditOpen}
        onOpenChange={setIsEditOpen}
        title={t.scans.rowActions.editScanName}
      >
        <EditScanForm
          scanId={scanId}
          scanName={scanName}
          setIsOpen={setIsEditOpen}
        />
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
            aria-label={t.scans.rowActions.actions}
            color="default"
            variant="flat"
          >
            <DropdownSection title={t.scans.rowActions.downloadReports}>
              <DropdownItem
                key="export"
                description={t.scans.rowActions.downloadZipDescription}
                textValue={t.scans.rowActions.downloadZip}
                startContent={<DownloadIcon className={iconClasses} />}
                onPress={() =>
                  downloadScanZip(scanId, toast, t.scans.reportDownload)
                }
                isDisabled={scanState !== "completed"}
              >
                {t.scans.rowActions.downloadZip}
              </DropdownItem>
            </DropdownSection>
            <DropdownSection title={t.scans.rowActions.actions}>
              <DropdownItem
                key="edit"
                description={t.scans.rowActions.editScanNameDescription}
                textValue={t.scans.rowActions.editScanName}
                startContent={<EditDocumentBulkIcon className={iconClasses} />}
                onPress={() => setIsEditOpen(true)}
              >
                {t.scans.rowActions.editScanNameButton}
              </DropdownItem>
            </DropdownSection>
          </DropdownMenu>
        </Dropdown>
      </div>
    </>
  );
}
