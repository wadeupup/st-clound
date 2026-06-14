"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const SCANS_REFRESH_INTERVAL_MS = 5000;

interface AutoRefreshProps {
  hasExecutingScan: boolean;
}

export function AutoRefresh({ hasExecutingScan }: AutoRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    if (!hasExecutingScan) return;

    const refreshIfVisible = () => {
      if (document.visibilityState !== "visible") return;
      router.refresh();
    };

    const interval = setInterval(refreshIfVisible, SCANS_REFRESH_INTERVAL_MS);
    const handleVisibilityChange = () => refreshIfVisible();

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [hasExecutingScan, router]);

  return null;
}
