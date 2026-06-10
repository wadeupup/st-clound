"use client";

import { Input, Textarea } from "@heroui/input";
import {
  Dispatch,
  SetStateAction,
  useActionState,
  useEffect,
  useRef,
} from "react";

import { createMuteRule } from "@/actions/mute-rules";
import { MuteRuleActionState } from "@/actions/mute-rules/types";
import { useToast } from "@/components/ui";
import { CustomAlertModal } from "@/components/ui/custom";
import { FormButtons } from "@/components/ui/form";
import { useI18n } from "@/lib/i18n/context";

interface MuteFindingsModalProps {
  isOpen: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  findingIds: string[];
  onComplete?: () => void;
}

export function MuteFindingsModal({
  isOpen,
  onOpenChange,
  findingIds,
  onComplete,
}: MuteFindingsModalProps) {
  const { t } = useI18n();
  const { toast } = useToast();

  // Use refs to avoid stale closures in useEffect
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  const [state, formAction, isPending] = useActionState<
    MuteRuleActionState,
    FormData
  >(createMuteRule, null);

  useEffect(() => {
    if (state?.success) {
      toast({
        title: t.findings.muteModal.success,
        description: state.success,
      });
      // Call onComplete BEFORE closing the modal to ensure router.refresh() executes
      onCompleteRef.current?.();
      onOpenChangeRef.current(false);
    } else if (state?.errors?.general) {
      toast({
        variant: "destructive",
        title: t.findings.muteModal.error,
        description: state.errors.general,
      });
    }
  }, [state, toast, t]);

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <CustomAlertModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={t.findings.muteModal.title}
      size="lg"
    >
      <form action={formAction} className="flex flex-col gap-4">
        <input
          type="hidden"
          name="finding_ids"
          value={JSON.stringify(findingIds)}
        />

        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {t.findings.muteModal.aboutToMute}{" "}
            <span className="font-semibold text-slate-900 dark:text-white">
              {findingIds.length}
            </span>{" "}
            {findingIds.length === 1
              ? t.findings.muteModal.finding
              : t.findings.muteModal.findings}
            .
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
            {t.findings.muteModal.mutedDescription}
          </p>
        </div>

        <Input
          name="name"
          label={t.findings.muteModal.ruleName}
          placeholder={t.findings.muteModal.ruleNamePlaceholder}
          isRequired
          variant="bordered"
          isInvalid={!!state?.errors?.name}
          errorMessage={state?.errors?.name}
          isDisabled={isPending}
          description={t.findings.muteModal.ruleNameDescription}
        />

        <Textarea
          name="reason"
          label={t.findings.muteModal.reason}
          placeholder={t.findings.muteModal.reasonPlaceholder}
          isRequired
          variant="bordered"
          minRows={3}
          maxRows={6}
          isInvalid={!!state?.errors?.reason}
          errorMessage={state?.errors?.reason}
          isDisabled={isPending}
          description={t.findings.muteModal.reasonDescription}
        />

        <FormButtons
          setIsOpen={onOpenChange}
          onCancel={handleCancel}
          submitText={t.findings.muteModal.muteFindings}
          isDisabled={isPending}
        />
      </form>
    </CustomAlertModal>
  );
}
