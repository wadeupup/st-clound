"use client";

import { Control } from "react-hook-form";

import { CustomTextarea } from "@/components/ui/custom";
import { useI18n } from "@/lib/i18n/context";
import { KubernetesCredentials } from "@/types";

export const KubernetesCredentialsForm = ({
  control,
}: {
  control: Control<KubernetesCredentials>;
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
          {labels.kubernetesCredentialsDescription}
        </div>
      </div>
      <CustomTextarea
        control={control}
        name="kubeconfig_content"
        label={labels.kubeconfigContent}
        labelPlacement="inside"
        placeholder={labels.pasteKubeconfigContent}
        variant="bordered"
        minRows={10}
        isRequired
      />
    </>
  );
};
