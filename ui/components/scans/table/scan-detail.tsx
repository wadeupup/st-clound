"use client";

import { Snippet } from "@heroui/snippet";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn";
import { DateWithTime, EntityInfo, InfoField } from "@/components/ui/entities";
import { StatusBadge } from "@/components/ui/table/status-badge";
import { useI18n } from "@/lib/i18n/context";
import { ProviderProps, ProviderType, ScanProps, TaskDetails } from "@/types";

const renderValue = (value: string | null | undefined) => {
  return value && value.trim() !== "" ? value : "-";
};

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

export const ScanDetail = ({
  scanDetails,
}: {
  scanDetails: ScanProps & {
    taskDetails?: TaskDetails;
    // TODO: Remove the "?" once we have a proper provider details type
    providerDetails?: ProviderProps;
  };
}) => {
  const { t } = useI18n();
  const scan = scanDetails.attributes;
  const taskDetails = scanDetails.taskDetails;
  const providerDetails = scanDetails.providerDetails?.attributes;

  return (
    <div className="flex flex-col gap-6 rounded-lg">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center">
          <StatusBadge
            size="md"
            className="w-fit"
            status={scan.state}
            loadingProgress={scan.progress}
          />
        </div>
        <EntityInfo
          cloudProvider={providerDetails?.provider as ProviderType}
          entityAlias={providerDetails?.alias}
          entityId={providerDetails?.uid}
          showConnectionStatus={providerDetails?.connection.connected}
        />
      </div>

      {/* Scan Details */}
      <Card variant="base" padding="lg">
        <CardHeader>
          <CardTitle>{t.scans.scanDetails.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <InfoField label={t.scans.scanDetails.scanName}>{renderValue(scan.name)}</InfoField>
            <InfoField label={t.scans.scanDetails.resourcesScanned}>
              {scan.unique_resource_count}
            </InfoField>
            <InfoField label={t.scans.scanDetails.progress}>{scan.progress}%</InfoField>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <InfoField label={t.scans.scanDetails.trigger}>{renderValue(scan.trigger)}</InfoField>
            <InfoField label={t.scans.scanDetails.state}>{renderValue(scan.state)}</InfoField>
            <InfoField label={t.scans.scanDetails.duration}>
              {formatDuration(scan.duration)}
            </InfoField>
          </div>

          <InfoField label={t.scans.scanDetails.scanId} variant="simple">
            <Snippet hideSymbol>{scanDetails.id}</Snippet>
          </InfoField>

          {scan.state === "failed" && taskDetails?.attributes.result && (
            <>
              {taskDetails.attributes.result.exc_message && (
                <InfoField label={t.scans.scanDetails.errorMessage} variant="simple">
                  <Snippet hideSymbol>
                    <span className="text-xs whitespace-pre-line">
                      {taskDetails.attributes.result.exc_message.join("\n")}
                    </span>
                  </Snippet>
                </InfoField>
              )}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InfoField label={t.scans.scanDetails.errorType}>
                  {renderValue(taskDetails.attributes.result.exc_type)}
                </InfoField>
              </div>
            </>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <InfoField label={t.scans.scanDetails.startedAt}>
              <DateWithTime inline dateTime={scan.started_at || "-"} />
            </InfoField>
            <InfoField label={t.scans.scanDetails.completedAt}>
              <DateWithTime inline dateTime={scan.completed_at || "-"} />
            </InfoField>
            <InfoField label={t.scans.scanDetails.scheduledAt}>
              <DateWithTime inline dateTime={scan.scheduled_at || "-"} />
            </InfoField>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
