"use client";
import Link from "next/link";

import { AddIcon } from "@/components/icons";
import { Button } from "@/components/shadcn";
import { useI18n } from "@/lib/i18n/context";

export const RolesAddButton = () => {
  const { t } = useI18n();
  return (
    <Button asChild>
      <Link href="/roles/new">
        {t.roles.addRole}
        <AddIcon size={20} />
      </Link>
    </Button>
  );
};
