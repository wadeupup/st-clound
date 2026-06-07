"use client";

import { Control } from "react-hook-form";

import { CustomInput } from "@/components/ui/custom";
import { useI18n } from "@/lib/i18n/context";
import { ProviderCredentialFields } from "@/lib/provider-credentials/provider-credential-fields";
import { MongoDBAtlasCredentials } from "@/types";

export const MongoDBAtlasCredentialsForm = ({
  control,
}: {
  control: Control<MongoDBAtlasCredentials>;
}) => {
  const { t } = useI18n();
  const labels = t.providers.connectAccount.credentialsType;

  return (
    <>
      <div className="flex flex-col">
        <div className="text-md text-default-foreground leading-9 font-bold">
          {labels.connectViaApiKeys}
        </div>
        <div className="text-default-500 text-sm">
          {labels.mongoAtlasKeysDescription}
        </div>
      </div>
      <CustomInput
        control={control}
        name={ProviderCredentialFields.ATLAS_PUBLIC_KEY}
        type="text"
        label={labels.atlasPublicKey}
        labelPlacement="inside"
        placeholder="e.g. abcdefgh"
        variant="bordered"
        isRequired
      />
      <CustomInput
        control={control}
        name={ProviderCredentialFields.ATLAS_PRIVATE_KEY}
        type="password"
        label={labels.atlasPrivateKey}
        labelPlacement="inside"
        placeholder={labels.enterPrivateKey}
        variant="bordered"
        isRequired
      />
      <div className="text-default-400 text-xs">
        {labels.mongoAtlasKeySecurityNote}
      </div>
    </>
  );
};
