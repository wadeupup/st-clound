"use client";

import { Divider } from "@heroui/divider";
import { Control } from "react-hook-form";

import { CustomInput } from "@/components/ui/custom";
import { useI18n } from "@/lib/i18n/context";
import { ProviderCredentialFields } from "@/lib/provider-credentials/provider-credential-fields";
import { AlibabaCloudCredentialsRole } from "@/types";

export const AlibabaCloudRoleCredentialsForm = ({
  control,
}: {
  control: Control<AlibabaCloudCredentialsRole>;
}) => {
  const { t } = useI18n();
  const labels = t.providers.connectAccount.credentialsType;

  return (
    <>
      <div className="flex flex-col">
        <div className="text-md text-default-foreground leading-9 font-bold">
          {labels.connectAssumingRamRole}
        </div>
        <div className="text-default-500 text-sm">
          {labels.alibabaRamRoleDescription}
        </div>
      </div>

      <span className="text-default-500 text-xs font-bold">
        {labels.ramRoleToAssume}
      </span>

      <CustomInput
        control={control}
        name={ProviderCredentialFields.ALIBABACLOUD_ROLE_ARN}
        type="text"
        label={labels.roleArn}
        labelPlacement="inside"
        placeholder="e.g. acs:ram::1234567890123456:role/ProwlerRole"
        variant="bordered"
        isRequired
      />

      <Divider />

      <span className="text-default-500 text-xs font-bold">
        {labels.credentialsForRoleAssumption}
      </span>

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

      <span className="text-default-500 text-xs">{labels.optionalFields}</span>

      <CustomInput
        control={control}
        name={ProviderCredentialFields.ALIBABACLOUD_ROLE_SESSION_NAME}
        type="text"
        label={labels.roleSessionName}
        labelPlacement="inside"
        placeholder={labels.enterRoleSessionNameWithDefault}
        variant="bordered"
        isRequired={false}
      />

      <div className="text-default-400 text-xs">
        {labels.alibabaRoleSecurityNote}
      </div>
    </>
  );
};
