"use client";

import { Chip } from "@heroui/chip";
import { useState } from "react";

import { Button, Card } from "@/components/shadcn";
import { CustomAlertModal } from "@/components/ui/custom";
import { DateWithTime, InfoField } from "@/components/ui/entities";
import { useI18n } from "@/lib/i18n/context";
import { MembershipDetailData } from "@/types/users";

import { EditTenantForm } from "../forms";

export const MembershipItem = ({
  membership,
  tenantName,
  tenantId,
  isOwner,
}: {
  membership: MembershipDetailData;
  tenantName: string;
  tenantId: string;
  isOwner: boolean;
}) => {
  const { t } = useI18n();
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <>
      <CustomAlertModal
        isOpen={isEditOpen}
        onOpenChange={setIsEditOpen}
        title=""
      >
        <EditTenantForm
          tenantId={tenantId}
          tenantName={tenantName}
          setIsOpen={setIsEditOpen}
        />
      </CustomAlertModal>
      <Card variant="inner" className="min-w-[320px] p-2 bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
        <div className="flex w-full items-center gap-4">
          <Chip size="sm" variant="flat" color="secondary">
            {membership.attributes.role}
          </Chip>

          <div className="flex flex-row flex-wrap gap-1 gap-x-4">
            <InfoField 
              label={t.profile.name} 
              inline 
              variant="transparent"
              className="[&>span]:text-slate-600 [&>span]:dark:text-slate-400 [&>div]:text-slate-900 [&>div]:dark:text-slate-100"
            >
              <span className="font-semibold whitespace-nowrap text-slate-900 dark:text-slate-100">
                {tenantName}
              </span>
            </InfoField>
            <InfoField 
              label={t.profile.joinedOn} 
              inline 
              variant="transparent"
              className="[&>span]:text-slate-600 [&>span]:dark:text-slate-400 [&>div]:text-slate-900 [&>div]:dark:text-slate-100"
            >
              <DateWithTime
                inline
                showTime={false}
                dateTime={membership.attributes.date_joined}
              />
            </InfoField>
          </div>

          {isOwner && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsEditOpen(true)}
              className="ml-auto"
            >
              {t.profile.edit}
            </Button>
          )}
        </div>
      </Card>
    </>
  );
};
