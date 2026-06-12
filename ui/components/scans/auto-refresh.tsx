"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const SCANS_REFRESH_INTERVAL_MS = 30000;

interface AutoRefreshProps {
  hasExecutingScan: boolean;
}

export function AutoRefresh({ hasExecutingScan }: AutoRefreshProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!hasExecutingScan) return;

    // Don't auto-refresh if scan details drawer is open
    const scanId = searchParams.get("scanId");
    if (scanId) return;

    const refreshIfVisible = () => {
      if (document.visibilityState !== "visible") return;
      router.refresh();
    };

    const interval = setInterval(refreshIfVisible, SCANS_REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [hasExecutingScan, router, searchParams]);

  return null;
}
