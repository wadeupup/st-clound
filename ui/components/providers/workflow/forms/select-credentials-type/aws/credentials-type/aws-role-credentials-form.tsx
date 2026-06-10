import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Select, SelectItem } from "@heroui/select";
import { Switch } from "@heroui/switch";
import { useEffect, useState } from "react";
import { Control, UseFormSetValue, useWatch } from "react-hook-form";

import { CredentialsRoleHelper } from "@/components/providers/workflow";
import { CustomInput } from "@/components/ui/custom";
import { useI18n } from "@/lib/i18n/context";
import { ProviderCredentialFields } from "@/lib/provider-credentials/provider-credential-fields";
import { AWSCredentialsRole } from "@/types";
import { IntegrationType } from "@/types/integrations";

import { AWSRegionOption, AWSRegionsSelect } from "./aws-regions-select";

export const AWSRoleCredentialsForm = ({
  control,
  setValue,
  externalId,
  templateLinks,
  regions = [],
  defaultRegions = [],
  type = "providers",
  integrationType,
}: {
  control: Control<AWSCredentialsRole>;
  setValue: UseFormSetValue<AWSCredentialsRole>;
  externalId: string;
  templateLinks: {
    cloudformation: string;
    cloudformationQuickLink: string;
    terraform: string;
  };
  regions?: AWSRegionOption[];
  defaultRegions?: string[];
  type?: "providers" | "integrations";
  integrationType?: IntegrationType;
}) => {
  const { t } = useI18n();
  const isCloudEnv = process.env.NEXT_PUBLIC_IS_CLOUD_ENV === "true";
  const defaultCredentialsType = "aws-sdk-default";

  const credentialsType = useWatch({
    control,
    name: ProviderCredentialFields.CREDENTIALS_TYPE,
    defaultValue: defaultCredentialsType,
  });

  const [showOptionalRole, setShowOptionalRole] = useState(false);

  const showRoleSection =
    type === "providers" ||
    (isCloudEnv && credentialsType === "aws-sdk-default") ||
    showOptionalRole;

  // Track role section visibility and ensure external_id is set
  useEffect(() => {
    // Set show_role_section for validation
    setValue("show_role_section" as any, showRoleSection);

    // When role section is shown, ensure external_id is set
    // This handles both initial mount and when the section becomes visible
    if (showRoleSection && externalId) {
      setValue(ProviderCredentialFields.EXTERNAL_ID, externalId, {
        shouldValidate: false,
        shouldDirty: false,
      });
    }
  }, [showRoleSection, setValue, externalId]);

  return (
    <>
      <div className="flex flex-col">
        {type === "providers" && (
          <div className="text-md text-default-foreground leading-9 font-bold">
            {t.providers.connectAccount.credentialsType.connectAssumingIamRole}
          </div>
        )}
      </div>

      <span className="text-default-500 text-xs font-bold">
        {t.providers.connectAccount.credentialsType.specifyCredentials}
      </span>

      <Select
        name={ProviderCredentialFields.CREDENTIALS_TYPE}
        label={t.providers.connectAccount.credentialsType.authenticationMethod}
        placeholder={
          t.providers.connectAccount.credentialsType.selectCredentialsType
        }
        selectedKeys={[credentialsType || defaultCredentialsType]}
        className="mb-4"
        variant="bordered"
        onSelectionChange={(keys) =>
          setValue(
            ProviderCredentialFields.CREDENTIALS_TYPE,
            Array.from(keys)[0] as "aws-sdk-default" | "access-secret-key",
          )
        }
      >
        <SelectItem
          key="aws-sdk-default"
          textValue={
            isCloudEnv
              ? t.providers.connectAccount.credentialsType
                  .prowlerCloudAssumeRole
              : `${t.providers.connectAccount.credentialsType.awsSdkDefault} ${t.providers.connectAccount.credentialsType.recommended}`
          }
        >
          <div className="flex w-full items-center justify-between">
            <span>
              {isCloudEnv
                ? t.providers.connectAccount.credentialsType
                    .prowlerCloudAssumeRole
                : `${t.providers.connectAccount.credentialsType.awsSdkDefault} ${t.providers.connectAccount.credentialsType.recommended}`}
            </span>
            {isCloudEnv && (
              <Chip size="sm" variant="flat" color="success" className="ml-2">
                {t.providers.connectAccount.credentialsType.recommended.replace(
                  /[()]/g,
                  "",
                )}
              </Chip>
            )}
          </div>
        </SelectItem>
        <SelectItem
          key="access-secret-key"
          textValue={t.providers.connectAccount.credentialsType.accessSecretKey}
        >
          <div className="flex w-full items-center justify-between">
            <span>
              {t.providers.connectAccount.credentialsType.accessSecretKey}
            </span>
          </div>
        </SelectItem>
      </Select>

      {credentialsType === "access-secret-key" && (
        <>
          <CustomInput
            control={control}
            name={ProviderCredentialFields.AWS_ACCESS_KEY_ID}
            type="password"
            label={t.providers.connectAccount.credentialsType.awsAccessKeyId}
            labelPlacement="inside"
            placeholder={
              t.providers.connectAccount.credentialsType.enterAwsAccessKeyId
            }
            variant="bordered"
            isRequired
          />
          <CustomInput
            control={control}
            name={ProviderCredentialFields.AWS_SECRET_ACCESS_KEY}
            type="password"
            label={
              t.providers.connectAccount.credentialsType.awsSecretAccessKey
            }
            labelPlacement="inside"
            placeholder={
              t.providers.connectAccount.credentialsType.enterAwsSecretAccessKey
            }
            variant="bordered"
            isRequired
          />
          <CustomInput
            control={control}
            name={ProviderCredentialFields.AWS_SESSION_TOKEN}
            type="password"
            label={t.providers.connectAccount.credentialsType.awsSessionToken}
            labelPlacement="inside"
            placeholder={
              t.providers.connectAccount.credentialsType.enterAwsSessionToken
            }
            variant="bordered"
            isRequired={false}
          />
        </>
      )}
      <Divider className="" />

      {type === "providers" ? (
        <span className="text-default-500 text-xs font-bold">
          {t.providers.connectAccount.credentialsType.assumeRole}
        </span>
      ) : (
        <div className="flex items-center justify-between">
          <span className="text-default-500 text-xs font-bold">
            {isCloudEnv && credentialsType === "aws-sdk-default"
              ? t.providers.connectAccount.credentialsType.addingRoleRequired
              : t.providers.connectAccount.credentialsType.optionallyAddRole}
          </span>
          <Switch
            size="sm"
            isSelected={showRoleSection}
            onValueChange={setShowOptionalRole}
            isDisabled={isCloudEnv && credentialsType === "aws-sdk-default"}
          />
        </div>
      )}

      {showRoleSection && (
        <>
          <CredentialsRoleHelper
            externalId={externalId}
            templateLinks={templateLinks}
            integrationType={integrationType}
          />

          <Divider />

          <CustomInput
            control={control}
            name={ProviderCredentialFields.ROLE_ARN}
            type="text"
            label={t.providers.connectAccount.credentialsType.roleArn}
            labelPlacement="inside"
            placeholder={
              t.providers.connectAccount.credentialsType.enterRoleArn
            }
            variant="bordered"
            isRequired={showRoleSection}
          />
          <CustomInput
            control={control}
            name={ProviderCredentialFields.EXTERNAL_ID}
            type="text"
            label={t.providers.connectAccount.credentialsType.externalId}
            labelPlacement="inside"
            placeholder={externalId}
            variant="bordered"
            defaultValue={externalId}
            isDisabled
            isRequired
          />

          <span className="text-default-500 text-xs">
            {t.providers.connectAccount.credentialsType.optionalFields}
          </span>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <CustomInput
              control={control}
              name={ProviderCredentialFields.ROLE_SESSION_NAME}
              type="text"
              label={t.providers.connectAccount.credentialsType.roleSessionName}
              labelPlacement="inside"
              placeholder={
                t.providers.connectAccount.credentialsType.enterRoleSessionName
              }
              variant="bordered"
              isRequired={false}
            />
            <CustomInput
              control={control}
              name={ProviderCredentialFields.SESSION_DURATION}
              type="number"
              label={t.providers.connectAccount.credentialsType.sessionDuration}
              labelPlacement="inside"
              placeholder={
                t.providers.connectAccount.credentialsType.enterSessionDuration
              }
              variant="bordered"
              isRequired={false}
            />
          </div>
        </>
      )}

      {type === "providers" && (
        <>
          <Divider />
          <AWSRegionsSelect
            control={control}
            setValue={setValue}
            regions={regions}
            defaultRegions={defaultRegions}
          />
        </>
      )}
    </>
  );
};
