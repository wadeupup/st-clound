"use client";

import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
} from "@heroui/dropdown";
import { Row } from "@tanstack/react-table";
import { VolumeOff, VolumeX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useContext, useState } from "react";

import { MuteFindingsModal } from "@/components/findings/mute-findings-modal";
import { SendToJiraModal } from "@/components/findings/send-to-jira-modal";
import { VerticalDotsIcon } from "@/components/icons";
import { JiraIcon } from "@/components/icons/services/IconServices";
import { Button } from "@/components/shadcn";
import { useI18n } from "@/lib/i18n/context";
import type { FindingProps } from "@/types/components";

import { FindingsSelectionContext } from "./findings-selection-context";

interface DataTableRowActionsProps {
  row: Row<FindingProps>;
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { t } = useI18n();
  const router = useRouter();
  const finding = row.original;
  const [isJiraModalOpen, setIsJiraModalOpen] = useState(false);
  const [isMuteModalOpen, setIsMuteModalOpen] = useState(false);

  const isMuted = finding.attributes.muted;

  // Get selection context - if there are other selected rows, include them
  const selectionContext = useContext(FindingsSelectionContext);
  const { selectedFindingIds, clearSelection } = selectionContext || {
    selectedFindingIds: [],
    clearSelection: () => {},
  };

  const findingTitle =
    finding.attributes.check_metadata?.checktitle ||
    t.findings.rowActions.securityFinding;

  // If current finding is selected and there are multiple selections, mute all
  // Otherwise, just mute this single finding
  const isCurrentSelected = selectedFindingIds.includes(finding.id);
  const hasMultipleSelected = selectedFindingIds.length > 1;

  const getMuteIds = (): string[] => {
    if (isCurrentSelected && hasMultipleSelected) {
      // Mute all selected including current
      return selectedFindingIds;
    }
    // Just mute the current finding
    return [finding.id];
  };

  const getMuteDescription = (): string => {
    if (isMuted) {
      return t.findings.rowActions.thisFindingIsAlreadyMuted;
    }
    const ids = getMuteIds();
    if (ids.length > 1) {
      return t.findings.rowActions.muteSelectedFindings.replace(
        "{count}",
        ids.length.toString(),
      );
    }
    return t.findings.rowActions.muteThisFinding;
  };

  const handleMuteComplete = () => {
    // Always clear selection when a finding is muted because:
    // 1. If the muted finding was selected, its index now points to a different finding
    // 2. rowSelection uses indices (0, 1, 2...) not IDs, so after refresh the wrong findings would appear selected
    clearSelection();
    router.refresh();
  };

  return (
    <>
      <SendToJiraModal
        isOpen={isJiraModalOpen}
        onOpenChange={setIsJiraModalOpen}
        findingId={finding.id}
        findingTitle={findingTitle}
      />

      <MuteFindingsModal
        isOpen={isMuteModalOpen}
        onOpenChange={setIsMuteModalOpen}
        findingIds={getMuteIds()}
        onComplete={handleMuteComplete}
      />

      <div className="flex items-center justify-center px-2">
        <Dropdown
          className="border-border-neutral-secondary bg-bg-neutral-secondary border shadow-xl"
          placement="bottom"
        >
          <DropdownTrigger>
            <Button
              variant="outline"
              size="icon-sm"
              className="size-7 rounded-full"
            >
              <VerticalDotsIcon
                size={16}
                className="text-text-neutral-secondary"
              />
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            closeOnSelect
            aria-label={t.findings.rowActions.findingActions}
            color="default"
            variant="flat"
          >
            <DropdownSection title={t.findings.rowActions.actions}>
              <DropdownItem
                key="mute"
                description={getMuteDescription()}
                textValue={t.findings.rowActions.mute}
                isDisabled={isMuted}
                startContent={
                  isMuted ? (
                    <VolumeOff className="text-default-300 pointer-events-none size-5 shrink-0" />
                  ) : (
                    <VolumeX className="text-default-500 pointer-events-none size-5 shrink-0" />
                  )
                }
                onPress={() => setIsMuteModalOpen(true)}
              >
                {isMuted
                  ? t.findings.rowActions.muted
                  : t.findings.rowActions.mute}
                {!isMuted && isCurrentSelected && hasMultipleSelected && (
                  <span className="ml-1 text-xs text-slate-500">
                    ({selectedFindingIds.length})
                  </span>
                )}
              </DropdownItem>
              <DropdownItem
                key="jira"
                description={t.findings.rowActions.createJiraIssue}
                textValue={t.findings.rowActions.sendToJira}
                startContent={
                  <JiraIcon
                    size={20}
                    className="text-default-500 pointer-events-none shrink-0"
                  />
                }
                onPress={() => setIsJiraModalOpen(true)}
              >
                {t.findings.rowActions.sendToJira}
              </DropdownItem>
            </DropdownSection>
          </DropdownMenu>
        </Dropdown>
      </div>
    </>
  );
}
