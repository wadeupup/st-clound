"use client";

import { RadioGroup } from "@heroui/radio";
import { Control, Controller, FieldValues, Path } from "react-hook-form";

import { CustomRadio } from "@/components/ui/custom";
import { FormMessage } from "@/components/ui/form";
import { useI18n } from "@/lib/i18n/context";

type RadioGroupAlibabaCloudViaCredentialsFormProps<T extends FieldValues> = {
  control: Control<T>;
  isInvalid: boolean;
  errorMessage?: string;
  onChange?: (value: string) => void;
};

export const RadioGroupAlibabaCloudViaCredentialsTypeForm = <
  T extends FieldValues,
>({
  control,
  isInvalid,
  errorMessage,
  onChange,
}: RadioGroupAlibabaCloudViaCredentialsFormProps<T>) => {
  const { t } = useI18n();
  const labels = t.providers.connectAccount.credentialsType;

  return (
    <Controller
      name={"alibabacloudCredentialsType" as Path<T>}
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
                {labels.usingRamRole}
              </span>
              <CustomRadio
                description={labels.connectAssumingRamRole}
                value="role"
              >
                <div className="flex items-center">
                  <span className="ml-2">{labels.connectAssumingRamRole}</span>
                </div>
              </CustomRadio>
              <span className="text-default-500 text-sm">
                {labels.usingCredentials}
              </span>
              <CustomRadio
                description={labels.connectViaAccessKeys}
                value="credentials"
              >
                <div className="flex items-center">
                  <span className="ml-2">{labels.connectViaAccessKeys}</span>
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
