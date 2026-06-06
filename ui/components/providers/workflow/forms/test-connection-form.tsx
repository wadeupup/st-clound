"use client";

import { Checkbox } from "@heroui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { Icon } from "@iconify/react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  checkConnectionProvider,
  deleteCredentials,
} from "@/actions/providers";
import { scanOnDemand, scheduleDaily } from "@/actions/scans";
import { getTask } from "@/actions/task/tasks";
import { CheckIcon, RocketIcon } from "@/components/icons";
import { Button } from "@/components/shadcn";
import { useToast } from "@/components/ui";
import { CustomLink } from "@/components/ui/custom/custom-link";
import { Form } from "@/components/ui/form";
import { useI18n } from "@/lib/i18n/context";
import { checkTaskStatus } from "@/lib/helper";
import { ProviderType } from "@/types";
import { ApiError, testConnectionFormSchema } from "@/types";

import { ProviderInfo } from "../..";

type FormValues = z.input<typeof testConnectionFormSchema>;

export const TestConnectionForm = ({
  searchParams,
  providerData,
}: {
  searchParams: { type: string; id: string; updated: string };
  providerData: {
    data: {
      id: string;
      type: string;
      attributes: {
        uid: string;
        connection: {
          connected: boolean | null;
          last_checked_at: string | null;
        };
        provider: ProviderType;
        alias: string;
        scanner_args: Record<string, unknown>;
      };
      relationships: {
        secret: {
          data: {
            type: string;
            id: string;
          } | null;
        };
      };
    };
  };
}) => {
  const { toast } = useToast();
  const { t } = useI18n();
  const router = useRouter();

  const providerType = searchParams.type;
  const providerId = searchParams.id;

  const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    error: string | null;
  } | null>(null);
  const [isResettingCredentials, setIsResettingCredentials] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const formSchema = testConnectionFormSchema;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      providerId,
      runOnce: false,
    },
  });

  const isLoading = form.formState.isSubmitting;
  const isUpdated = searchParams?.updated === "true";

  const onSubmitClient = async (values: FormValues) => {
    const formData = new FormData();
    formData.append("providerId", values.providerId);

    const data = await checkConnectionProvider(formData);

    if (data?.errors && data.errors.length > 0) {
      data.errors.forEach((error: ApiError) => {
        const errorMessage = error.detail;

        switch (errorMessage) {
          case "Not found.":
            setApiErrorMessage(errorMessage);
            break;
          default:
            toast({
              variant: "destructive",
              title: `Error ${error.status}`,
              description: errorMessage,
            });
        }
      });
    } else {
      const taskId = data.data.id;
      setApiErrorMessage(null);

      // Use the helper function to check the task status
      const taskResult = await checkTaskStatus(taskId);

      if (taskResult.completed) {
        const task = await getTask(taskId);
        const { connected, error } = task.data.attributes.result;

        setConnectionStatus({
          connected,
          error: connected ? null : error || "Unknown error",
        });

        if (connected && isUpdated) return router.push("/providers");

        if (connected && !isUpdated) {
          try {
            // Check if the runOnce checkbox is checked
            const runOnce = form.watch("runOnce");

            let data;

            if (runOnce) {
              data = await scanOnDemand(formData);
            } else {
              data = await scheduleDaily(formData);
            }

            if (data.error) {
              setApiErrorMessage(data.error);
              form.setError("providerId", {
                type: "server",
                message: data.error,
              });
            } else {
              setIsRedirecting(true);
              router.push("/scans");
            }
          } catch (error) {
            form.setError("providerId", {
              type: "server",
              message: t.providers.connectAccount.testConnection.unexpectedError,
            });
          }
        } else {
          setConnectionStatus({
            connected: false,
            error: error || t.providers.connectAccount.testConnection.connectionFailed,
          });
        }
      } else {
        setConnectionStatus({
          connected: false,
          error: taskResult.error || "Unknown error",
        });
      }
    }
  };

  const onResetCredentials = async () => {
    setIsResettingCredentials(true);

    // Check if provider the provider has no credentials
    const providerSecretId =
      providerData?.data?.relationships?.secret?.data?.id;
    const hasNoCredentials = !providerSecretId;

    if (hasNoCredentials) {
      // If no credentials, redirect to add credentials page
      router.push(
        `/providers/add-credentials?type=${providerType}&id=${providerId}`,
      );
      return;
    }

    // If provider has credentials, delete them first
    try {
      await deleteCredentials(providerSecretId);
      // After successful deletion, redirect to add credentials page
      router.push(
        `/providers/add-credentials?type=${providerType}&id=${providerId}`,
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to delete credentials:", error);
    } finally {
      setIsResettingCredentials(false);
    }
  };

  if (isRedirecting) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-12">
        <div className="relative">
          <div className="bg-primary/20 h-24 w-24 animate-pulse rounded-full" />
          <div className="border-primary absolute inset-0 h-24 w-24 animate-spin rounded-full border-4 border-t-transparent" />
        </div>
        <div className="text-center">
          <p className="text-primary text-xl font-medium">
            {t.providers.connectAccount.testConnection.scanInitiatedSuccessfully}
          </p>
          <p className="text-small mt-2 font-bold text-gray-500">
            {t.providers.connectAccount.testConnection.redirectingToScans}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmitClient)}
        className="flex flex-col gap-4"
      >
        <div className="text-left">
          <div className="mb-2 text-xl font-medium">
            {!isUpdated
              ? t.providers.connectAccount.testConnection.title
              : t.providers.connectAccount.testConnection.titleUpdated}
          </div>
          <p className="text-small text-default-500 py-2">
            {!isUpdated
              ? t.providers.connectAccount.testConnection.description
              : t.providers.connectAccount.testConnection.descriptionUpdated}
          </p>
        </div>

        {apiErrorMessage && (
          <div className="text-text-error-primary mt-4 rounded-md p-3">
            <p>
              {t.providers.connectAccount.testConnection.providerIdError.replace(
                "{error}",
                apiErrorMessage?.toLowerCase() || "",
              )}
            </p>
          </div>
        )}

        {connectionStatus && !connectionStatus.connected && (
          <>
            <div className="border-border-error flex items-start gap-4 rounded-lg border p-4">
              <div className="flex shrink-0 items-center">
                <Icon
                  icon="heroicons:exclamation-circle"
                  className="text-text-error-primary h-5 w-5"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-small text-text-error-primary break-words">
                  {connectionStatus.error || t.providers.connectAccount.testConnection.unknownError}
                </p>
              </div>
            </div>
            <p className="text-small text-text-error-primary">
              {t.providers.connectAccount.testConnection.credentialsIssue}
            </p>
          </>
        )}

        <ProviderInfo
          connected={providerData.data.attributes.connection.connected}
          provider={providerData.data.attributes.provider}
          providerAlias={providerData.data.attributes.alias}
          providerUID={providerData.data.attributes.uid}
        />

        {!isUpdated && !connectionStatus?.error && (
          <Checkbox
            {...form.register("runOnce")}
            isSelected={!!form.watch("runOnce")}
            classNames={{
              label: "text-small",
              wrapper: "checkbox-update",
            }}
            color="default"
          >
            {t.providers.connectAccount.testConnection.runSingleScan}
          </Checkbox>
        )}

        {isUpdated && !connectionStatus?.error && (
          <p className="text-small text-default-500 py-2">
            {t.providers.connectAccount.testConnection.checkNewCredentials}
          </p>
        )}

        <input type="hidden" name="providerId" value={providerId} />

        <div className="flex w-full justify-end sm:gap-6">
          {apiErrorMessage ? (
            <CustomLink
              href="/providers"
              target="_self"
              className="mr-3 flex w-fit items-center justify-center gap-2 rounded-lg border border-solid border-gray-200 px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <Icon
                icon="icon-park-outline:close-small"
                className="h-5 w-5 text-gray-600 dark:text-gray-400"
              />
              <span>{t.providers.connectAccount.testConnection.backToProviders}</span>
            </CustomLink>
          ) : connectionStatus?.error ? (
            <Button
              onClick={isUpdated ? () => router.back() : onResetCredentials}
              type="button"
              variant="secondary"
              size="lg"
              disabled={isResettingCredentials}
            >
              {isResettingCredentials ? (
                <Loader2 className="animate-spin" />
              ) : (
                <CheckIcon size={24} />
              )}
              {isResettingCredentials
                ? t.providers.connectAccount.testConnection.loading
                : isUpdated
                  ? t.providers.connectAccount.testConnection.updateCredentials
                  : t.providers.connectAccount.testConnection.resetCredentials}
            </Button>
          ) : (
            <Button
              type={
                isUpdated && connectionStatus?.connected ? "button" : "submit"
              }
              variant="default"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                !isUpdated && <RocketIcon size={24} />
              )}
              {isLoading
                ? t.providers.connectAccount.testConnection.loading
                : isUpdated
                  ? t.providers.connectAccount.testConnection.checkConnection
                  : t.providers.connectAccount.testConnection.launchScan}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
};
