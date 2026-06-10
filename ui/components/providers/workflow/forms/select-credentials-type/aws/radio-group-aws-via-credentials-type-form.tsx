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

export const RadioGroupAWSViaCredentialsTypeForm = ({
  control,
  isInvalid,
  errorMessage,
  onChange,
}: RadioGroupAWSViaCredentialsFormProps) => {
  const { t } = useI18n();
  return (
    <Controller
      name="awsCredentialsType"
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
                {t.providers.connectAccount.credentialsType.usingIamRole}
              </span>
              <CustomRadio
                description={
                  t.providers.connectAccount.credentialsType
                    .connectAssumingIamRole
                }
                value="role"
              >
                <div className="flex items-center">
                  <span className="ml-2">
                    {
                      t.providers.connectAccount.credentialsType
                        .connectAssumingIamRole
                    }{" "}
                    <span className="text-default-500">
                      {t.providers.connectAccount.credentialsType.recommended}
                    </span>
                  </span>
                </div>
              </CustomRadio>
              <span className="text-default-500 text-sm">
                {t.providers.connectAccount.credentialsType.usingCredentials}
              </span>
              <CustomRadio
                description={
                  t.providers.connectAccount.credentialsType
                    .connectViaCredentials
                }
                value="credentials"
              >
                <div className="flex items-center">
                  <span className="ml-2">
                    {
                      t.providers.connectAccount.credentialsType
                        .connectViaCredentials
                    }
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
