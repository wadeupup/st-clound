"use client";
import Link from "next/link";

import { AddIcon } from "@/components/icons";
import { Button } from "@/components/shadcn";
import { useI18n } from "@/lib/i18n/context";

export const UsersInviteButton = () => {
  const { t } = useI18n();
  return (
    <Button asChild>
      <Link href="/invitations/new">
        {t.users.inviteUser}
        <AddIcon size={20} />
      </Link>
    </Button>
  );
};
