"use client";

import { Control, Controller } from "react-hook-form";

import { CustomInput, CustomTextarea } from "@/components/ui/custom";
import { useI18n } from "@/lib/i18n/context";
import { ProviderCredentialFields } from "@/lib/provider-credentials/provider-credential-fields";
import { OCICredentials } from "@/types";

export const OracleCloudCredentialsForm = ({
  control,
}: {
  control: Control<OCICredentials>;
}) => {
  const { t } = useI18n();
  const labels = t.providers.connectAccount.credentialsType;

  return (
    <>
      <div className="flex flex-col">
        <div className="text-md text-default-foreground leading-9 font-bold">
          {labels.connectViaApiKey}
        </div>
        <div className="text-default-500 text-sm">
          {labels.ociApiKeyDescription}
        </div>
      </div>
      {/* Hidden input for tenancy - auto-populated from provider UID */}
      <Controller
        control={control}
        name={ProviderCredentialFields.OCI_TENANCY}
        render={({ field }) => <input type="hidden" {...field} />}
      />
      <CustomInput
        control={control}
        name={ProviderCredentialFields.OCI_USER}
        type="text"
        label={labels.userOcid}
        labelPlacement="inside"
        placeholder="ocid1.user.oc1..aaaaaaa..."
        variant="bordered"
        isRequired
      />
      <CustomInput
        control={control}
        name={ProviderCredentialFields.OCI_FINGERPRINT}
        type="text"
        label={labels.fingerprint}
        labelPlacement="inside"
        placeholder={labels.enterApiKeyFingerprint}
        variant="bordered"
        isRequired
      />
      <CustomInput
        control={control}
        name={ProviderCredentialFields.OCI_REGION}
        type="text"
        label={labels.region}
        labelPlacement="inside"
        placeholder="e.g. us-ashburn-1"
        variant="bordered"
        isRequired
      />
      <CustomTextarea
        control={control}
        name={ProviderCredentialFields.OCI_KEY_CONTENT}
        label={labels.privateKeyContent}
        labelPlacement="inside"
        placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;MIIEpAIBAAKCAQEA...&#10;-----END RSA PRIVATE KEY-----"
        variant="bordered"
        minRows={6}
        isRequired
      />
      <CustomInput
        control={control}
        name={ProviderCredentialFields.OCI_PASS_PHRASE}
        type="password"
        label={labels.passphraseOptional}
        labelPlacement="inside"
        placeholder={labels.enterPassphraseIfKeyEncrypted}
        variant="bordered"
        isRequired={false}
      />
      <div className="text-default-400 text-xs">{labels.ociPrivateKeyNote}</div>
    </>
  );
};
