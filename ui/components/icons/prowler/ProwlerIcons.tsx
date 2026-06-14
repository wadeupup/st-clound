import React from "react";

import { IconSvgProps } from "../../../types/index";

export const ProwlerExtended: React.FC<IconSvgProps> = ({
  size,
  width = 216,
  height,
  ...props
}) => {
  return (
    <svg
      className="text-prowler-black dark:text-prowler-white"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 520 140"
      fill="none"
      height={size || height}
      width={size || width}
      {...props}
    >
      <rect width="140" height="140" rx="28" fill="currentColor" />
      <path
        d="M34 95h72"
        stroke="white"
        strokeWidth="14"
        strokeLinecap="round"
      />
      <path
        d="M43 64h54"
        stroke="white"
        strokeWidth="14"
        strokeLinecap="round"
      />
      <path
        d="M55 36h30"
        stroke="white"
        strokeWidth="14"
        strokeLinecap="round"
      />
      <text
        x="168"
        y="88"
        fill="currentColor"
        fontSize="64"
        fontWeight="800"
        letterSpacing="0"
      >
        ST Cloud
      </text>
    </svg>
  );
};

export const ProwlerShort: React.FC<IconSvgProps> = ({
  size,
  width = 30,
  height,
  ...props
}) => (
  <svg
    className="text-prowler-black dark:text-prowler-white"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 140 140"
    fill="none"
    height={size || height}
    width={size || width}
    {...props}
  >
    <rect width="140" height="140" rx="28" fill="currentColor" />
    <path d="M34 95h72" stroke="white" strokeWidth="14" strokeLinecap="round" />
    <path d="M43 64h54" stroke="white" strokeWidth="14" strokeLinecap="round" />
    <path d="M55 36h30" stroke="white" strokeWidth="14" strokeLinecap="round" />
  </svg>
);
