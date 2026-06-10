"use client";

import { FC } from "react";
import { Control, Controller } from "react-hook-form";
import { z } from "zod";

import { cn } from "@/lib/utils";
import { addProviderFormSchema } from "@/types";

import { AWSProviderBadge, AzureProviderBadge } from "../icons/providers-badge";
import { FormMessage } from "../ui/form";

const PROVIDERS = [
  {
    value: "aws",
    label: "Amazon Web Services",
    badge: AWSProviderBadge,
  },
  {
    value: "azure",
    label: "Microsoft Azure",
    badge: AzureProviderBadge,
  },
] as const;

interface RadioGroupProviderProps {
  control: Control<z.infer<typeof addProviderFormSchema>>;
  isInvalid: boolean;
  errorMessage?: string;
}

export const RadioGroupProvider: FC<RadioGroupProviderProps> = ({
  control,
  isInvalid,
  errorMessage,
}) => {
  return (
    <Controller
      name="providerType"
      control={control}
      render={({ field }) => (
        <div className="flex flex-col gap-3 px-4">
          {PROVIDERS.map((provider) => {
            const BadgeComponent = provider.badge;
            const isSelected = field.value === provider.value;

            return (
              <button
                key={provider.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => field.onChange(provider.value)}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-3 rounded-lg border p-4 text-left transition-all",
                  "hover:border-button-primary",
                  "focus-visible:border-button-primary focus-visible:ring-button-primary focus:outline-none focus-visible:ring-1",
                  isSelected
                    ? "border-button-primary bg-bg-neutral-tertiary"
                    : "border-border-neutral-secondary bg-bg-neutral-secondary",
                  isInvalid && "border-bg-fail",
                )}
              >
                <BadgeComponent size={26} />
                <span className="text-text-neutral-primary text-sm font-medium">
                  {provider.label}
                </span>
              </button>
            );
          })}

          {errorMessage && (
            <FormMessage className="text-text-error">
              {errorMessage}
            </FormMessage>
          )}
        </div>
      )}
    />
  );
};
