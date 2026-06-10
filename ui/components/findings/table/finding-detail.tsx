"use client";

import { Snippet } from "@heroui/snippet";
import { Tooltip } from "@heroui/tooltip";
import { ExternalLink, Link } from "lucide-react";
import ReactMarkdown from "react-markdown";

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcn";
import { CodeSnippet } from "@/components/ui/code-snippet/code-snippet";
import { CustomLink } from "@/components/ui/custom/custom-link";
import { EntityInfo, InfoField } from "@/components/ui/entities";
import { DateWithTime } from "@/components/ui/entities/date-with-time";
import { SeverityBadge } from "@/components/ui/table/severity-badge";
import { useI18n } from "@/lib/i18n/context";
import { buildGitFileUrl, extractLineRangeFromUid } from "@/lib/iac-utils";
import { FindingProps, ProviderType } from "@/types";

import { Muted } from "../muted";
import { DeltaIndicator } from "./delta-indicator";

const MarkdownContainer = ({ children }: { children: string }) => {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none break-words whitespace-normal">
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
};

const renderValue = (value: string | null | undefined) => {
  return value && value.trim() !== "" ? value : "-";
};

// Add new utility function for duration formatting
const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (remainingSeconds > 0 || parts.length === 0)
    parts.push(`${remainingSeconds}s`);

  return parts.join(" ");
};

export const FindingDetail = ({
  findingDetails,
}: {
  findingDetails: FindingProps;
}) => {
  const { t } = useI18n();
  const finding = findingDetails;
  const attributes = finding.attributes;
  const resource = finding.relationships.resource.attributes;
  const scan = finding.relationships.scan.attributes;
  const providerDetails = finding.relationships.provider.attributes;
  const currentUrl = new URL(window.location.href);
  const params = new URLSearchParams(currentUrl.search);
  params.set("id", findingDetails.id);
  const url = `${window.location.origin}${currentUrl.pathname}?${params.toString()}`;

  // Build Git URL for IaC findings
  const gitUrl =
    providerDetails.provider === "iac"
      ? buildGitFileUrl(
          providerDetails.uid,
          resource.name,
          extractLineRangeFromUid(attributes.uid) || "",
          resource.region,
        )
      : null;

  return (
    <div className="flex flex-col gap-6 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="dark:text-prowler-theme-pale/90 line-clamp-2 flex items-center gap-2 text-lg leading-tight font-medium text-gray-800">
            {renderValue(attributes.check_metadata.checktitle)}
            <Tooltip content={t.findings.findingDetail.copyLink} size="sm">
              <button
                onClick={() => navigator.clipboard.writeText(url)}
                className="text-bg-data-info inline-flex cursor-pointer transition-opacity hover:opacity-80"
                aria-label={t.findings.findingDetail.copyLink}
              >
                <Link size={16} />
              </button>
            </Tooltip>
          </h2>
        </div>
        <div className="flex items-center gap-x-4">
          <Muted
            isMuted={attributes.muted}
            mutedReason={attributes.muted_reason || ""}
          />
        </div>
      </div>

      {/* Check Metadata */}
      <Card variant="base" padding="lg">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>{t.findings.findingDetail.title}</CardTitle>
          <div
            className={`rounded-lg px-3 py-1 text-sm font-semibold ${
              attributes.status === "PASS"
                ? "bg-green-100 text-green-600"
                : attributes.status === "MANUAL"
                  ? "bg-gray-100 text-gray-600"
                  : "text-system-severity-critical bg-red-100"
            }`}
          >
            {renderValue(attributes.status)}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-4">
            <EntityInfo
              cloudProvider={providerDetails.provider as ProviderType}
              entityAlias={providerDetails.alias}
              entityId={providerDetails.uid}
              showConnectionStatus={providerDetails.connection.connected}
            />
            <InfoField label={t.findings.findingDetail.service}>
              {attributes.check_metadata.servicename}
            </InfoField>
            <InfoField label={t.findings.findingDetail.region}>
              {resource.region}
            </InfoField>
            <InfoField label={t.findings.findingDetail.firstSeen}>
              <DateWithTime inline dateTime={attributes.first_seen_at || "-"} />
            </InfoField>
            {attributes.delta && (
              <InfoField
                label={t.findings.findingDetail.delta}
                tooltipContent={t.findings.findingDetail.deltaTooltip}
                className="capitalize"
              >
                <div className="flex items-center gap-2">
                  <DeltaIndicator delta={attributes.delta} />
                  {attributes.delta}
                </div>
              </InfoField>
            )}
            <InfoField
              label={t.findings.findingDetail.severity}
              variant="simple"
            >
              <SeverityBadge severity={attributes.severity || "-"} />
            </InfoField>
          </div>
          <InfoField
            label={t.findings.findingDetail.findingId}
            variant="simple"
          >
            <CodeSnippet value={findingDetails.id} />
          </InfoField>
          <InfoField label={t.findings.findingDetail.checkId} variant="simple">
            <CodeSnippet value={attributes.check_id} />
          </InfoField>
          <InfoField
            label={t.findings.findingDetail.findingUid}
            variant="simple"
          >
            <CodeSnippet value={attributes.uid} />
          </InfoField>
          <InfoField
            label={t.findings.findingDetail.resourceId}
            variant="simple"
          >
            <CodeSnippet value={resource.uid} />
          </InfoField>

          {attributes.status === "FAIL" && (
            <InfoField label={t.findings.findingDetail.risk} variant="simple">
              <Snippet
                className="max-w-full py-2"
                color="danger"
                hideCopyButton
                hideSymbol
              >
                <MarkdownContainer>
                  {attributes.check_metadata.risk}
                </MarkdownContainer>
              </Snippet>
            </InfoField>
          )}

          <InfoField label={t.findings.findingDetail.description}>
            <MarkdownContainer>
              {attributes.check_metadata.description}
            </MarkdownContainer>
          </InfoField>

          <InfoField label={t.findings.findingDetail.statusExtended}>
            {renderValue(attributes.status_extended)}
          </InfoField>

          {attributes.check_metadata.remediation && (
            <div className="flex flex-col gap-4">
              <h4 className="dark:text-prowler-theme-pale/90 text-sm font-bold text-gray-700">
                {t.findings.findingDetail.remediationDetails}
              </h4>

              {/* Recommendation section */}
              {attributes.check_metadata.remediation.recommendation.text && (
                <InfoField label={t.findings.findingDetail.recommendation}>
                  <div className="flex flex-col gap-2">
                    <MarkdownContainer>
                      {
                        attributes.check_metadata.remediation.recommendation
                          .text
                      }
                    </MarkdownContainer>

                    {attributes.check_metadata.remediation.recommendation
                      .url && (
                      <CustomLink
                        href={
                          attributes.check_metadata.remediation.recommendation
                            .url
                        }
                        size="sm"
                      >
                        {t.findings.findingDetail.learnMore}
                      </CustomLink>
                    )}
                  </div>
                </InfoField>
              )}

              {/* CLI Command section */}
              {attributes.check_metadata.remediation.code.cli && (
                <InfoField
                  label={t.findings.findingDetail.cliCommand}
                  variant="simple"
                >
                  <Snippet>
                    <span className="text-xs whitespace-pre-line">
                      {attributes.check_metadata.remediation.code.cli}
                    </span>
                  </Snippet>
                </InfoField>
              )}

              {/* Remediation Steps section */}
              {attributes.check_metadata.remediation.code.other && (
                <InfoField label={t.findings.findingDetail.remediationSteps}>
                  <MarkdownContainer>
                    {attributes.check_metadata.remediation.code.other}
                  </MarkdownContainer>
                </InfoField>
              )}

              {/* Additional URLs section */}
              {attributes.check_metadata.additionalurls &&
                attributes.check_metadata.additionalurls.length > 0 && (
                  <InfoField label={t.findings.findingDetail.references}>
                    <ul className="list-inside list-disc space-y-1">
                      {attributes.check_metadata.additionalurls.map(
                        (link, idx) => (
                          <li key={idx}>
                            <CustomLink
                              href={link}
                              size="sm"
                              className="break-all whitespace-normal!"
                            >
                              {link}
                            </CustomLink>
                          </li>
                        ),
                      )}
                    </ul>
                  </InfoField>
                )}
            </div>
          )}

          <InfoField label={t.findings.findingDetail.categories}>
            {attributes.check_metadata.categories?.join(", ") ||
              t.findings.findingDetail.none}
          </InfoField>
        </CardContent>
      </Card>

      {/* Resource Details */}
      <Card variant="base" padding="lg">
        <CardHeader>
          <CardTitle>{t.findings.findingDetail.resourceDetails}</CardTitle>
          {providerDetails.provider === "iac" && gitUrl && (
            <CardAction>
              <Tooltip
                content={t.findings.findingDetail.goToResource}
                size="sm"
              >
                <a
                  href={gitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-bg-data-info inline-flex cursor-pointer"
                  aria-label={t.findings.findingDetail.openResourceInRepository}
                >
                  <ExternalLink size={16} className="inline" />
                </a>
              </Tooltip>
            </CardAction>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoField label={t.findings.findingDetail.resourceName}>
              {renderValue(resource.name)}
            </InfoField>
            <InfoField label={t.findings.findingDetail.resourceType}>
              {renderValue(resource.type)}
            </InfoField>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoField label={t.findings.findingDetail.service}>
              {renderValue(resource.service)}
            </InfoField>
            <InfoField label={t.findings.findingDetail.region}>
              {renderValue(resource.region)}
            </InfoField>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoField label={t.findings.findingDetail.partition}>
              {renderValue(resource.partition)}
            </InfoField>
            <InfoField label={t.findings.findingDetail.details}>
              {renderValue(resource.details)}
            </InfoField>
          </div>

          {resource.tags && Object.entries(resource.tags).length > 0 && (
            <div className="flex flex-col gap-4">
              <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400">
                {t.findings.findingDetail.tags}
              </h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {Object.entries(resource.tags).map(([key, value]) => (
                  <InfoField key={key} label={key}>
                    {renderValue(value)}
                  </InfoField>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoField label={t.findings.findingDetail.createdAt}>
              <DateWithTime inline dateTime={resource.inserted_at || "-"} />
            </InfoField>
            <InfoField label={t.findings.findingDetail.lastUpdated}>
              <DateWithTime inline dateTime={resource.updated_at || "-"} />
            </InfoField>
          </div>
        </CardContent>
      </Card>

      {/* Add new Scan Details section */}
      <Card variant="base" padding="lg">
        <CardHeader>
          <CardTitle>{t.findings.findingDetail.scanDetails}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <InfoField label={t.findings.findingDetail.scanName}>
              {scan.name || t.findings.findingDetail.notAvailable}
            </InfoField>
            <InfoField label={t.findings.findingDetail.resourcesScanned}>
              {scan.unique_resource_count}
            </InfoField>
            <InfoField label={t.findings.findingDetail.progress}>
              {scan.progress}%
            </InfoField>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <InfoField label={t.findings.findingDetail.trigger}>
              {scan.trigger}
            </InfoField>
            <InfoField label={t.findings.findingDetail.state}>
              {scan.state}
            </InfoField>
            <InfoField label={t.findings.findingDetail.duration}>
              {formatDuration(scan.duration)}
            </InfoField>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoField label={t.findings.findingDetail.startedAt}>
              <DateWithTime inline dateTime={scan.started_at || "-"} />
            </InfoField>
            <InfoField label={t.findings.findingDetail.completedAt}>
              <DateWithTime inline dateTime={scan.completed_at || "-"} />
            </InfoField>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoField label={t.findings.findingDetail.launchedAt}>
              <DateWithTime inline dateTime={scan.inserted_at || "-"} />
            </InfoField>
            {scan.scheduled_at && (
              <InfoField label={t.findings.findingDetail.scheduledAt}>
                <DateWithTime inline dateTime={scan.scheduled_at} />
              </InfoField>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
