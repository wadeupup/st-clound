import { Row } from "@tanstack/react-table";
import { useState } from "react";

import { DownloadIconButton, useToast } from "@/components/ui";
import { downloadScanZip } from "@/lib";
import { useI18n } from "@/lib/i18n/context";

interface DataTableDownloadDetailsProps<ScanProps> {
  row: Row<ScanProps>;
}

export function DataTableDownloadDetails<ScanProps>({
  row,
}: DataTableDownloadDetailsProps<ScanProps>) {
  const { toast } = useToast();
  const { t } = useI18n();
  const [isDownloading, setIsDownloading] = useState(false);

  const scanId = (row.original as { id: string }).id;
  const scanState = (row.original as any).attributes?.state;
  const scanProgress = (row.original as any).attributes?.progress;
  const canDownloadReport = scanState === "completed" && scanProgress === 100;

  const handleDownload = async () => {
    if (!canDownloadReport) return;

    setIsDownloading(true);
    await downloadScanZip(scanId, toast, t.scans.reportDownload);
    setIsDownloading(false);
  };

  return (
    <DownloadIconButton
      paramId={scanId}
      onDownload={handleDownload}
      ariaLabel={t.scans.reportDownload.tooltip}
      textTooltip={t.scans.reportDownload.tooltip}
      isDownloading={isDownloading}
      isDisabled={!canDownloadReport}
    />
  );
}
