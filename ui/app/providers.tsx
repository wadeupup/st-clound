"use client";

// Import Sentry client-side initialization
import "@/app/instrumentation.client";

import { HeroUIProvider } from "@heroui/system";
import { useRouter } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeProviderProps } from "next-themes/dist/types";
import * as React from "react";

import { I18nProvider } from "@/lib/i18n/context";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();

  return (
    <SessionProvider>
      <HeroUIProvider navigate={router.push}>
        <NextThemesProvider {...themeProps}>
          <I18nProvider>{children}</I18nProvider>
        </NextThemesProvider>
      </HeroUIProvider>
    </SessionProvider>
  );
}
