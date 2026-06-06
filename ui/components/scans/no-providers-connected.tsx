"use client";

import Link from "next/link";

import { Button, Card, CardContent } from "@/components/shadcn";
import { useI18n } from "@/lib/i18n/context";

import { InfoIcon } from "../icons/Icons";

export const NoProvidersConnected = () => {
  const { t } = useI18n();
  return (
    <Card variant="base">
      <CardContent className="flex w-full flex-col items-start gap-6 md:flex-row md:items-center md:justify-between md:gap-8">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-start gap-3">
            <InfoIcon className="h-6 w-6 text-gray-800 dark:text-white" />
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">
              {t.scans.noProviders.noConnectedCloudProviders}
            </h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t.scans.noProviders.noConnectedProvidersDescription}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t.scans.noProviders.noConnectedProvidersDescription2}
          </p>
        </div>
        <div className="w-full md:w-auto md:shrink-0">
          <Button
            asChild
            className="w-full justify-center md:w-fit"
            aria-label="Go to Cloud providers page"
          >
            <Link href="/providers">{t.scans.noProviders.reviewCloudProviders}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
