"use client";

import { Snippet } from "@heroui/snippet";
import Link from "next/link";

import { AddIcon } from "../icons";
import { Button, Card, CardContent, CardHeader } from "../shadcn";
import { Separator } from "../shadcn/separator/separator";
import { DateWithTime } from "../ui/entities";
import { useI18n } from "@/lib/i18n/context";

interface InvitationDetailsProps {
  attributes: {
    email: string;
    state: string;
    token: string;
    expires_at: string;
    inserted_at: string;
    updated_at: string;
  };
  relationships?: {
    inviter: {
      data: {
        id: string;
      };
    };
  };
  selfLink: string;
}

const InfoField = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1">
    <span className="text-text-neutral-secondary text-xs font-bold">
      {label}
    </span>
    <div className="border-border-input-primary bg-bg-input-primary flex items-center rounded-lg border p-3">
      <span className="text-small text-text-neutral-primary">{children}</span>
    </div>
  </div>
);

export const InvitationDetails = ({ attributes }: InvitationDetailsProps) => {
  const { t } = useI18n();
  // window.location.origin to get the current base URL
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000";

  const invitationLink = `${baseUrl}/sign-up?invitation_token=${attributes.token}`;

  return (
    <div className="flex flex-col gap-x-4 gap-y-8">
      <Card variant="base" padding="lg">
        <CardHeader>{t.invitations.checkDetails.invitationDetails}</CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <InfoField label={t.invitations.checkDetails.email}>
              {attributes.email}
            </InfoField>

            <InfoField label={t.invitations.checkDetails.token}>
              {attributes.token}
            </InfoField>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <InfoField label={t.invitations.checkDetails.state}>
                <span className="capitalize">
                  {(() => {
                    const stateMap: Record<string, string> = {
                      pending: t.invitations.filters.pending,
                      accepted: t.invitations.filters.accepted,
                      expired: t.invitations.filters.expired,
                      revoked: t.invitations.filters.revoked,
                    };
                    return stateMap[attributes.state] || attributes.state;
                  })()}
                </span>
              </InfoField>

              <InfoField label={t.invitations.checkDetails.expiresAt}>
                <DateWithTime dateTime={attributes.expires_at} inline />
              </InfoField>

              <InfoField label={t.invitations.checkDetails.createdAt}>
                <DateWithTime dateTime={attributes.inserted_at} inline />
              </InfoField>

              <InfoField label={t.invitations.checkDetails.updatedAt}>
                <DateWithTime dateTime={attributes.updated_at} inline />
              </InfoField>
            </div>
          </div>

          <Separator className="my-4" />
          <h3 className="text-text-neutral-primary pb-2 text-sm font-bold">
            {t.invitations.checkDetails.shareLink}
          </h3>

          <div className="flex flex-col items-start justify-between">
            <Snippet
              classNames={{
                base: "mx-auto",
              }}
              hideSymbol
              variant="bordered"
              className="bg-bg-neutral-secondary overflow-hidden py-1 text-ellipsis whitespace-nowrap"
            >
              <p className="no-scrollbar w-fit overflow-hidden overflow-x-scroll text-sm text-ellipsis whitespace-nowrap">
                {invitationLink}
              </p>
            </Snippet>
          </div>
        </CardContent>
      </Card>
      <div className="flex w-full items-center justify-end">
        <Button asChild size="default" className="gap-2">
          <Link href="/invitations/">
            {t.invitations.checkDetails.backToInvitations}
            <AddIcon size={20} />
          </Link>
        </Button>
      </div>
    </div>
  );
};
