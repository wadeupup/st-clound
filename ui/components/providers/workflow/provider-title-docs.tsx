"use client";

import { getProviderName } from "@/components/ui/entities/get-provider-logo";
import { getProviderLogo } from "@/components/ui/entities/get-provider-logo";
import { useI18n } from "@/lib/i18n/context";
import { ProviderType } from "@/types";

export const ProviderTitleDocs = ({
  providerType,
}: {
  providerType: ProviderType;
}) => {
  const { t } = useI18n();
  return (
    <div className="flex gap-4">
      {providerType && getProviderLogo(providerType as ProviderType)}
      <span className="text-lg font-semibold">
        {providerType
          ? getProviderName(providerType as ProviderType)
          : t.providers.connectAccount.unknownProvider}
      </span>
    </div>
  );
};
