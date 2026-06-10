"use client";

import { Control, UseFormSetValue } from "react-hook-form";

import { CustomInput } from "@/components/ui/custom";
import { useI18n } from "@/lib/i18n/context";
import { ProviderCredentialFields } from "@/lib/provider-credentials/provider-credential-fields";
import { AWSCredentials } from "@/types";

import { AWSRegionOption, AWSRegionsSelect } from "./aws-regions-select";

export const AWSStaticCredentialsForm = ({
  control,
  setValue,
  regions,
  defaultRegions,
}: {
  control: Control<AWSCredentials>;
  setValue: UseFormSetValue<AWSCredentials>;
  regions: AWSRegionOption[];
  defaultRegions: string[];
}) => {
  const { t } = useI18n();
  const labels = t.providers.connectAccount.credentialsType;

  return (
    <>
      <div className="flex flex-col">
        <div className="text-md text-default-foreground leading-9 font-bold">
          {labels.connectViaCredentials}
        </div>
        <div className="text-default-500 text-sm">
          {labels.awsCredentialsDescription}
        </div>
      </div>
      <CustomInput
        control={control}
        name={ProviderCredentialFields.AWS_ACCESS_KEY_ID}
        type="password"
        label={labels.awsAccessKeyId}
        labelPlacement="inside"
        placeholder={labels.enterAwsAccessKeyId}
        variant="bordered"
        isRequired
      />
      <CustomInput
        control={control}
        name={ProviderCredentialFields.AWS_SECRET_ACCESS_KEY}
        type="password"
        label={labels.awsSecretAccessKey}
        labelPlacement="inside"
        placeholder={labels.enterAwsSecretAccessKey}
        variant="bordered"
        isRequired
      />
      <CustomInput
        control={control}
        name={ProviderCredentialFields.AWS_SESSION_TOKEN}
        type="password"
        label={labels.awsSessionToken}
        labelPlacement="inside"
        placeholder={labels.enterAwsSessionToken}
        variant="bordered"
        isRequired={false}
      />
      <AWSRegionsSelect
        control={control}
        setValue={setValue}
        regions={regions}
        defaultRegions={defaultRegions}
      />
    </>
  );
};
