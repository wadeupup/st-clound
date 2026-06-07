"use client";

import { Control } from "react-hook-form";

import { CustomTextarea } from "@/components/ui/custom";
import { useI18n } from "@/lib/i18n/context";
import { GCPServiceAccountKey } from "@/types";

export const GCPServiceAccountKeyForm = ({
  control,
}: {
  control: Control<GCPServiceAccountKey>;
}) => {
  const { t } = useI18n();
  const labels = t.providers.connectAccount.credentialsType;

  return (
    <>
      <div className="flex flex-col">
        <div className="text-md text-default-foreground leading-9 font-bold">
          {labels.connectViaServiceAccountKey}
        </div>
        <div className="text-default-500 text-sm">
          {labels.gcpServiceAccountKeyDescription}
        </div>
      </div>
      <CustomTextarea
        control={control}
        name="service_account_key"
        label={labels.serviceAccountKey}
        labelPlacement="inside"
        placeholder={labels.pasteServiceAccountKeyJson}
        variant="bordered"
        minRows={10}
        isRequired
      />
    </>
  );
};
