"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select/select";
import { useI18n } from "@/lib/i18n/context";
import { ProviderType, ScanProps } from "@/types";

import { ComplianceScanInfo } from "./compliance-scan-info";

export interface SelectScanComplianceDataProps {
  scans: (ScanProps & {
    providerInfo: {
      provider: ProviderType;
      uid: string;
      alias: string;
    };
  })[];
  selectedScanId: string;
  onSelectionChange: (selectedKey: string) => void;
}

export const ScanSelector = ({
  scans,
  selectedScanId,
  onSelectionChange,
}: SelectScanComplianceDataProps) => {
  const { t } = useI18n();
  const selectedScan = scans.find((item) => item.id === selectedScanId);

  return (
    <Select
      value={selectedScanId}
      onValueChange={(value) => {
        if (value && value !== selectedScanId) {
          onSelectionChange(value);
        }
      }}
    >
      <SelectTrigger className="w-full min-w-[365px]">
        <SelectValue placeholder={t.compliance.selectScan}>
          {selectedScan ? (
            <ComplianceScanInfo scan={selectedScan} />
          ) : (
            t.compliance.selectScan
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {scans.map((scan) => (
          <SelectItem key={scan.id} value={scan.id}>
            <ComplianceScanInfo scan={scan} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
