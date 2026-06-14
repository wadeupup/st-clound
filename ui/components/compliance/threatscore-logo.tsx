"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export const ThreatScoreLogo = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-14" style={{ width: "280px", height: "56px" }} />;
  }

  const brandColor = resolvedTheme === "dark" ? "#fff" : "#0f172a";

  return (
    <svg
      viewBox="0 0 1000 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-14 w-auto"
      preserveAspectRatio="xMinYMid meet"
    >
      <text
        x="0"
        y="112"
        fontSize="100"
        fontWeight="800"
        letterSpacing="0"
        fill={brandColor}
      >
        ST CLOUD
      </text>

      <text x="0" y="240" fontSize="80" fontWeight="700" fill="#22c55e">
        THREATSCORE
      </text>

      <g transform="translate(680, 0) scale(2)">
        <path
          d="M 20 80 A 60 60 0 0 1 50 29.6"
          stroke="#fb923c"
          strokeWidth="16"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 50 29.6 A 60 60 0 0 1 110 29.6"
          stroke="#ef4444"
          strokeWidth="16"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 110 29.6 A 60 60 0 0 1 140 80"
          stroke="#22c55e"
          strokeWidth="16"
          fill="none"
          strokeLinecap="round"
        />

        <path
          d="M 60 80 L 72 92 L 104 60"
          stroke="#22c55e"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};
