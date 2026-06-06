"use client";
import { useI18n } from "@/lib/i18n/context";

export const RoleManagementTitle = () => {
  const { t } = useI18n();
  return <>{t.roles.roleManagement}</>;
};

