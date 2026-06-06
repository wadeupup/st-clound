"use client";

import { Divider } from "@heroui/divider";

import { Snippet } from "@heroui/snippet";
import { Tooltip } from "@heroui/tooltip";
import { CopyIcon, DoneIcon } from "@/components/icons";
import { Card, CardContent } from "@/components/shadcn";
import { DateWithTime, InfoField } from "@/components/ui/entities";
import { useI18n } from "@/lib/i18n/context";
import { UserDataWithRoles } from "@/types/users";

const TenantIdCopy = ({ id }: { id: string }) => {
  return (
    <div className="flex items-center gap-2 whitespace-nowrap md:flex-col md:items-start md:justify-start">
      <Snippet
        className="h-6"
        classNames={{
          content: "min-w-0 overflow-hidden",
          pre: "min-w-0 overflow-hidden text-ellipsis whitespace-nowrap",
          base: "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg border py-1",
        }}
        size="sm"
        hideSymbol
        copyIcon={<CopyIcon size={16} />}
        checkIcon={<DoneIcon size={16} />}
        codeString={id}
      >
        <div className="flex min-w-0 items-center gap-2">
          <Tooltip content={id} placement="top" size="sm">
            <span className="min-w-0 flex-1 truncate text-xs text-slate-900 dark:text-slate-100">
              {id}
            </span>
          </Tooltip>
        </div>
      </Snippet>
    </div>
  );
};

export const UserBasicInfoCard = ({
  user,
  tenantId,
}: {
  user: UserDataWithRoles;
  tenantId: string;
}) => {
  const { t } = useI18n();
  const { name, email, company_name, date_joined } = user.attributes;

  return (
    <Card variant="base" padding="none" className="rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm shadow-lg dark:border-slate-800 dark:bg-slate-900/80 p-6">
      <CardContent>
        <div className="flex flex-col">
          <span className="text-md font-bold text-slate-900 dark:text-slate-100">{name}</span>
          <span className="text-xs font-light text-slate-600 dark:text-slate-400">
            {email}
            {company_name && ` | ${company_name}`}
          </span>
        </div>
        <Divider className="my-4 border-slate-200 dark:border-slate-800" />
        <div className="flex flex-row gap-4 md:items-start md:justify-start md:gap-8">
          <div className="flex gap-2 whitespace-nowrap md:flex-col md:items-start md:justify-start">
            <div className="flex items-center gap-2">
              <InfoField 
                label={t.profile.dateJoined} 
                variant="simple"
                className="[&>span]:text-slate-600 [&>span]:dark:text-slate-400 [&>div]:text-slate-900 [&>div]:dark:text-slate-100"
              >
                <DateWithTime inline dateTime={date_joined} />
              </InfoField>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <InfoField 
              label={t.profile.organizationId} 
              variant="transparent"
              className="[&>span]:text-slate-600 [&>span]:dark:text-slate-400 [&>div]:text-slate-900 [&>div]:dark:text-slate-100"
            >
              {tenantId ? (
                <TenantIdCopy id={tenantId} />
              ) : (
                <span className="text-xs font-light text-slate-600 dark:text-slate-400">{t.profile.noOrganization}</span>
              )}
            </InfoField>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
