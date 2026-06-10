"use client";

import { IdIcon } from "@/components/icons";
import { Button } from "@/components/shadcn";
import { SnippetChip } from "@/components/ui/entities";
import { useI18n } from "@/lib/i18n/context";
import { IntegrationType } from "@/types/integrations";

interface CredentialsRoleHelperProps {
  externalId: string;
  templateLinks: {
    cloudformation: string;
    cloudformationQuickLink: string;
    terraform: string;
  };
  integrationType?: IntegrationType;
}

export const CredentialsRoleHelper = ({
  externalId,
  templateLinks,
  integrationType,
}: CredentialsRoleHelperProps) => {
  const { t } = useI18n();
  const isAmazonS3 = integrationType === "amazon_s3";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t.providers.connectAccount.credentialsType
            .readOnlyRoleMustBeCreatedPrefix && (
            <span>
              {
                t.providers.connectAccount.credentialsType
                  .readOnlyRoleMustBeCreatedPrefix
              }{" "}
            </span>
          )}
          <strong>
            {t.providers.connectAccount.credentialsType.readOnlyRole}
          </strong>
          {t.providers.connectAccount.credentialsType
            .readOnlyRoleMustBeCreatedSuffix && (
            <span>
              {" "}
              {
                t.providers.connectAccount.credentialsType
                  .readOnlyRoleMustBeCreatedSuffix
              }
            </span>
          )}
          {isAmazonS3 && (
            <span> {t.providers.connectAccount.credentialsType.orUpdated}</span>
          )}
        </p>

        <Button
          aria-label={
            t.providers.connectAccount.credentialsType
              .useCloudFormationQuickLink
          }
          variant="link"
          className="h-auto w-fit min-w-0 p-0"
          asChild
        >
          <a
            href={templateLinks.cloudformationQuickLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            {
              t.providers.connectAccount.credentialsType
                .useCloudFormationQuickLink
            }
          </a>
        </Button>

        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
          <span className="text-xs font-bold text-gray-900 dark:text-gray-300">
            {t.providers.connectAccount.credentialsType.or}
          </span>
          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          {isAmazonS3
            ? t.providers.connectAccount.credentialsType.referToDocumentation
            : t.providers.connectAccount.credentialsType
                .useTemplateToCreateRole}
        </p>

        <div className="flex w-fit flex-col gap-2">
          <Button
            aria-label={
              t.providers.connectAccount.credentialsType.cloudFormationTemplate
            }
            variant="link"
            className="h-auto w-fit min-w-0 p-0"
            asChild
          >
            <a
              href={templateLinks.cloudformation}
              target="_blank"
              rel="noopener noreferrer"
            >
              {
                t.providers.connectAccount.credentialsType
                  .cloudFormationTemplate
              }
            </a>
          </Button>
          <Button
            aria-label={
              t.providers.connectAccount.credentialsType.terraformCode
            }
            variant="link"
            className="h-auto w-fit min-w-0 p-0"
            asChild
          >
            <a
              href={templateLinks.terraform}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t.providers.connectAccount.credentialsType.terraformCode}
            </a>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-default-500 block text-xs font-medium">
            {t.providers.connectAccount.credentialsType.externalIdLabel}
          </span>
          <SnippetChip value={externalId} icon={<IdIcon size={16} />} />
        </div>
      </div>
    </div>
  );
};
