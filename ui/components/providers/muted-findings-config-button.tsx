"use client";

import { SettingsIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/shadcn";
import { useI18n } from "@/lib/i18n/context";

export const MutedFindingsConfigButton = () => {
  const { t } = useI18n();
  return (
    <Button variant="outline" asChild>
      <Link href="/mutelist">
        <SettingsIcon size={20} />
        {t.providers.configureMutelist}
      </Link>
    </Button>
  );
};
