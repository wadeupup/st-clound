"use client";
import { usePathname } from "next/navigation";
import { CheckDetailsTitle } from "./check-details-title";
import { SendInvitationTitle } from "./send-invitation-title";

export const DynamicTitle = () => {
  const pathname = usePathname();
  const isCheckDetails = pathname?.includes("/check-details");

  return isCheckDetails ? <CheckDetailsTitle /> : <SendInvitationTitle />;
};

