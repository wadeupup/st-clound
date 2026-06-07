"use client";

import { Control } from "react-hook-form";

import { CustomInput } from "@/components/ui/custom";
import { useI18n } from "@/lib/i18n/context";
import { ProviderCredentialFields } from "@/lib/provider-credentials/provider-credential-fields";
import { AlibabaCloudCredentials } from "@/types";

export const AlibabaCloudStaticCredentialsForm = ({
  control,
}: {
  control: Control<AlibabaCloudCredentials>;
}) => {
  const { t } = useI18n();
  const labels = t.providers.connectAccount.credentialsType;

  return (
    <>
      <div className="flex flex-col">
        <div className="text-md text-default-foreground leading-9 font-bold">
          {labels.connectViaAccessKeys}
        </div>
        <div className="text-default-500 text-sm">
          {labels.alibabaAccessKeysDescription}
        </div>
      </div>
      <CustomInput
        control={control}
        name={ProviderCredentialFields.ALIBABACLOUD_ACCESS_KEY_ID}
        type="text"
        label={labels.accessKeyId}
        labelPlacement="inside"
        placeholder="e.g. LTAI5txxxxxxxxxx"
        variant="bordered"
        isRequired
      />
      <CustomInput
        control={control}
        name={ProviderCredentialFields.ALIBABACLOUD_ACCESS_KEY_SECRET}
        type="password"
        label={labels.accessKeySecret}
        labelPlacement="inside"
        placeholder={labels.enterAccessKeySecret}
        variant="bordered"
        isRequired
      />
      <div className="text-default-400 text-xs">
        {labels.alibabaAccessKeySecurityNote}
      </div>
    </>
  );
};
