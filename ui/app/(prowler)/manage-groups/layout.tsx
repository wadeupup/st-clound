import "@/styles/globals.css";

import React from "react";

import { ContentLayout } from "@/components/ui";

import { ManageGroupsTitle } from "./manage-groups-title";

interface ProviderLayoutProps {
  children: React.ReactNode;
}

export default function ProviderLayout({ children }: ProviderLayoutProps) {
  return (
    <ContentLayout title={<ManageGroupsTitle />} icon="lucide:group">
      {children}
    </ContentLayout>
  );
}
