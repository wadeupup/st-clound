"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeftIcon, ChevronRightIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { addProvider } from "@/actions/providers/providers";
import { ProviderTitleDocs } from "@/components/providers/workflow/provider-title-docs";
import { Button } from "@/components/shadcn";
import { useToast } from "@/components/ui";
import { CustomInput } from "@/components/ui/custom";
import { Form } from "@/components/ui/form";
import { useI18n } from "@/lib/i18n/context";
import { addProviderFormSchema, ApiError, ProviderType } from "@/types";

import { RadioGroupProvider } from "../../radio-group-provider";

export type FormValues = z.infer<typeof addProviderFormSchema>;

// Helper function for labels and placeholders
const getProviderFieldDetails = (providerType: ProviderType | undefined, t: ReturnType<typeof useI18n>["t"]) => {
  switch (providerType) {
    case "aws":
      return {
        label: t.providers.connectAccount.fieldLabels.accountId,
        placeholder: t.providers.connectAccount.placeholders.accountId,
      };
    case "gcp":
      return {
        label: t.providers.connectAccount.fieldLabels.projectId,
        placeholder: t.providers.connectAccount.placeholders.projectId,
      };
    case "azure":
      return {
        label: t.providers.connectAccount.fieldLabels.subscriptionId,
        placeholder: t.providers.connectAccount.placeholders.subscriptionId,
      };
    case "kubernetes":
      return {
        label: t.providers.connectAccount.fieldLabels.kubernetesContext,
        placeholder: t.providers.connectAccount.placeholders.kubernetesContext,
      };
    case "m365":
      return {
        label: t.providers.connectAccount.fieldLabels.domainId,
        placeholder: t.providers.connectAccount.placeholders.domainId,
      };
    case "github":
      return {
        label: t.providers.connectAccount.fieldLabels.username,
        placeholder: t.providers.connectAccount.placeholders.username,
      };
    case "iac":
      return {
        label: t.providers.connectAccount.fieldLabels.repositoryUrl,
        placeholder: t.providers.connectAccount.placeholders.repositoryUrl,
      };
    case "oraclecloud":
      return {
        label: t.providers.connectAccount.fieldLabels.tenancyOcid,
        placeholder: t.providers.connectAccount.placeholders.tenancyOcid,
      };
    case "mongodbatlas":
      return {
        label: t.providers.connectAccount.fieldLabels.organizationId,
        placeholder: t.providers.connectAccount.placeholders.organizationId,
      };
    case "alibabacloud":
      return {
        label: t.providers.connectAccount.fieldLabels.accountId,
        placeholder: t.providers.connectAccount.placeholders.accountId,
      };
    default:
      return {
        label: t.providers.connectAccount.fieldLabels.providerUid,
        placeholder: t.providers.connectAccount.placeholders.providerUid,
      };
  }
};

export const ConnectAccountForm = () => {
  const { toast } = useToast();
  const { t } = useI18n();
  const [prevStep, setPrevStep] = useState(1);
  const router = useRouter();

  const formSchema = addProviderFormSchema;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      providerType: undefined,
      providerUid: "",
      providerAlias: "",
    },
  });

  const providerType = form.watch("providerType");
  const providerFieldDetails = getProviderFieldDetails(providerType, t);

  const isLoading = form.formState.isSubmitting;

  const onSubmitClient = async (values: FormValues) => {
    const formValues = { ...values };

    const formData = new FormData();
    Object.entries(formValues).forEach(
      ([key, value]) => value !== undefined && formData.append(key, value),
    );

    try {
      const data = await addProvider(formData);

      if (data?.errors && data.errors.length > 0) {
        // Handle server-side validation errors
        data.errors.forEach((error: ApiError) => {
          const errorMessage = error.detail;
          const pointer = error.source?.pointer;

          switch (pointer) {
            case "/data/attributes/provider":
              form.setError("providerType", {
                type: "server",
                message: errorMessage,
              });
              break;
            case "/data/attributes/uid":
            case "/data/attributes/__all__":
              form.setError("providerUid", {
                type: "server",
                message: errorMessage,
              });
              break;
            case "/data/attributes/alias":
              form.setError("providerAlias", {
                type: "server",
                message: errorMessage,
              });
              break;
            default:
              toast({
                variant: "destructive",
                title: t.providers.connectAccount.somethingWentWrong,
                description: errorMessage,
              });
          }
        });
        return;
      } else {
        // Go to the next step after successful submission
        const {
          id,
          attributes: { provider: providerType },
        } = data.data;

        router.push(`/providers/add-credentials?type=${providerType}&id=${id}`);
      }
    } catch (error: unknown) {
      // eslint-disable-next-line no-console
      console.error("Error during submission:", error);
      toast({
        variant: "destructive",
        title: t.providers.connectAccount.submissionError,
        description:
          error instanceof Error
            ? error.message
            : t.providers.connectAccount.tryAgain,
      });
    }
  };

  const handleBackStep = () => {
    setPrevStep((prev) => prev - 1);
    //Deselect the providerType if the user is going back to the first step
    if (prevStep === 2) {
      form.setValue("providerType", undefined as unknown as ProviderType);
    }
    // Reset the providerUid and providerAlias fields when going back
    form.setValue("providerUid", "");
    form.setValue("providerAlias", "");
  };

  useEffect(() => {
    if (providerType) {
      setPrevStep(2);
    }
  }, [providerType]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmitClient)}
        className="flex flex-col gap-4"
      >
        {/* Step 1: Provider selection */}
        {prevStep === 1 && (
          <RadioGroupProvider
            control={form.control}
            isInvalid={!!form.formState.errors.providerType}
            errorMessage={form.formState.errors.providerType?.message}
          />
        )}
        {/* Step 2: UID, alias, and credentials (if AWS) */}
        {prevStep === 2 && (
          <>
            <ProviderTitleDocs providerType={providerType} />
            <CustomInput
              control={form.control}
              name="providerUid"
              type="text"
              label={providerFieldDetails.label}
              labelPlacement="inside"
              placeholder={providerFieldDetails.placeholder}
              variant="bordered"
              isRequired
            />
            <CustomInput
              control={form.control}
              name="providerAlias"
              type="text"
              label={t.providers.connectAccount.providerAlias}
              labelPlacement="inside"
              placeholder={t.providers.connectAccount.providerAliasPlaceholder}
              variant="bordered"
              isRequired={false}
            />
          </>
        )}
        {/* Navigation buttons */}
        <div className="flex w-full justify-end gap-4">
          {/* Show "Back" button only in Step 2 */}
          {prevStep === 2 && (
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={handleBackStep}
              disabled={isLoading}
            >
              {!isLoading && <ChevronLeftIcon size={24} />}
              {t.providers.connectAccount.back}
            </Button>
          )}
          {/* Show "Next" button in Step 2 */}
          {prevStep === 2 && (
            <Button
              type="submit"
              variant="default"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <ChevronRightIcon size={24} />
              )}
              {isLoading ? t.providers.connectAccount.loading : t.providers.connectAccount.next}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
};
