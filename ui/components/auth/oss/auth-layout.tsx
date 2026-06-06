"use client";

import { ReactNode } from "react";
import Image from "next/image";

import { ThemeSwitch } from "@/components/ThemeSwitch";
import { LanguageSwitcher } from "@/components/ui/language-switcher/language-switcher";
import stLogo from "@/components/icons/compliance/st.png";

interface AuthLayoutProps {
  title: string;
  children: ReactNode;
}

export const AuthLayout = ({ title, children }: AuthLayoutProps) => {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 px-4 py-12">
      <div className="flex w-full max-w-md flex-col items-center gap-10">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex w-full max-w-[180px]">
            <Image
              src={stLogo}
              alt="Logo"
              width={180}
              height={60}
              className="h-auto w-full object-contain"
              priority
            />
          </div>
          <p className="text-base font-medium text-slate-700 dark:text-slate-300">
            St Cloud
          </p>
        </div>

        {/* Auth Form Container */}
        <div className="w-full space-y-6 rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm shadow-lg dark:border-slate-800 dark:bg-slate-900/80 p-8">
          {/* Header with Title, Language Switcher and Theme Toggle */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <h1
              className="text-2xl font-semibold text-slate-900 dark:text-slate-100"
              suppressHydrationWarning
            >
              {title}
            </h1>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeSwitch aria-label="Toggle theme" />
            </div>
          </div>

          {/* Content */}
          {children}
        </div>
      </div>
    </div>
  );
};
