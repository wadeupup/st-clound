"use client";

import Link from "next/link";

import { Button } from "@/components/shadcn";
import { useI18n } from "@/lib/i18n/context";

import { AddIcon } from "../icons";

export const AddProviderButton = () => {
  const { t } = useI18n();
  return (
    <Button asChild>
      <Link href="/providers/connect-account">
        {t.providers.addCloudProvider}
        <AddIcon size={20} />
      </Link>
    </Button>
  );
};
