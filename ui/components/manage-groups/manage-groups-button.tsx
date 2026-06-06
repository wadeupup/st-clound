"use client";

import { SettingsIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/shadcn";
import { useI18n } from "@/lib/i18n/context";

export const ManageGroupsButton = () => {
  const { t } = useI18n();
  return (
    <Button asChild variant="outline">
      <Link href="/manage-groups">
        <SettingsIcon size={20} />
        {t.providers.manageGroups}
      </Link>
    </Button>
  );
};
