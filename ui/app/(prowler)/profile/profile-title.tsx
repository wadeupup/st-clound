"use client";

import { ReactNode } from "react";

import { ContentLayout } from "@/components/ui";
import { useI18n } from "@/lib/i18n/context";

export function ProfileTitle({ children }: { children: ReactNode }) {
  const { t } = useI18n();

  return (
    <ContentLayout title={t.profile.userProfile} icon="lucide:users">
      {children}
    </ContentLayout>
  );
}
