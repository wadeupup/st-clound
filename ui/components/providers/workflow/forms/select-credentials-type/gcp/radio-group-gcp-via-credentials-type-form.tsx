"use client";

import { RadioGroup } from "@heroui/radio";
import React from "react";
import { Control, Controller } from "react-hook-form";

import { CustomRadio } from "@/components/ui/custom";
import { FormMessage } from "@/components/ui/form";
import { useI18n } from "@/lib/i18n/context";

type RadioGroupAWSViaCredentialsFormProps = {
  control: Control<any>;
  isInvalid: boolean;
  errorMessage?: string;
  onChange?: (value: string) => void;
};

export const RadioGroupGCPViaCredentialsTypeForm = ({
  control,
  isInvalid,
  errorMessage,
  onChange,
}: RadioGroupAWSViaCredentialsFormProps) => {
  const { t } = useI18n();
  const labels = t.providers.connectAccount.credentialsType;

  return (
    <Controller
      name="gcpCredentialsType"
      control={control}
      render={({ field }) => (
        <>
          <RadioGroup
            className="flex flex-wrap"
            isInvalid={isInvalid}
            {...field}
            value={field.value || ""}
            onValueChange={(value) => {
              field.onChange(value);
              if (onChange) {
                onChange(value);
              }
            }}
          >
            <div className="flex flex-col gap-4">
              <span className="text-default-500 text-sm">
                {labels.usingServiceAccount}
              </span>
              <CustomRadio
                description={labels.connectUsingServiceAccount}
                value="service-account"
              >
                <div className="flex items-center">
                  <span className="ml-2">
                    {labels.connectViaServiceAccountKey}
                  </span>
                </div>
              </CustomRadio>
              <span className="text-default-500 text-sm">
                {labels.usingApplicationDefaultCredentials}
              </span>
              <CustomRadio
                description={labels.connectViaCredentials}
                value="credentials"
              >
                <div className="flex items-center">
                  <span className="ml-2">
                    {labels.connectViaApplicationDefaultCredentials}
                  </span>
                </div>
              </CustomRadio>
            </div>
          </RadioGroup>
          {errorMessage && (
            <FormMessage className="text-text-error">
              {errorMessage}
            </FormMessage>
          )}
        </>
      )}
    />
  );
};
