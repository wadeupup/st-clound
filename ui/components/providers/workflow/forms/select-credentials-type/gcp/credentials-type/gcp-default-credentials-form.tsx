"use client";

import { Control } from "react-hook-form";

import { CustomInput } from "@/components/ui/custom";
import { useI18n } from "@/lib/i18n/context";
import { GCPDefaultCredentials } from "@/types";

export const GCPDefaultCredentialsForm = ({
  control,
}: {
  control: Control<GCPDefaultCredentials>;
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
          {labels.gcpCredentialsDescription}
        </div>
      </div>
      <CustomInput
        control={control}
        name="client_id"
        type="text"
        label={labels.clientId}
        labelPlacement="inside"
        placeholder={labels.enterClientId}
        variant="bordered"
        isRequired
      />
      <CustomInput
        control={control}
        name="client_secret"
        type="password"
        label={labels.clientSecret}
        labelPlacement="inside"
        placeholder={labels.enterClientSecret}
        variant="bordered"
        isRequired
      />
      <CustomInput
        control={control}
        name="refresh_token"
        type="password"
        label={labels.refreshToken}
        labelPlacement="inside"
        placeholder={labels.enterRefreshToken}
        variant="bordered"
        isRequired
      />
    </>
  );
};
