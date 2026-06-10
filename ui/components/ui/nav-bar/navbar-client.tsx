"use client";

import { ReactNode } from "react";

import { ThemeSwitch } from "@/components/ThemeSwitch";
import { BreadcrumbNavigation } from "@/components/ui";
import { LanguageSwitcher } from "@/components/ui/language-switcher/language-switcher";
import { useSidebar } from "@/hooks/use-sidebar";

import { SheetMenu } from "../sidebar/sheet-menu";
import { SidebarToggle } from "../sidebar/sidebar-toggle";
import { UserNav } from "../user-nav/user-nav";

interface NavbarClientProps {
  title: string | ReactNode;
  icon?: string | ReactNode;
}

export function NavbarClient({ title, icon }: NavbarClientProps) {
  const { isOpen, toggleOpen } = useSidebar();

  return (
    <header className="sticky top-0 z-10 w-full border-b border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80">
      <div className="mx-4 flex h-14 items-center sm:mx-8">
        <div className="flex items-center gap-2">
          <SheetMenu />
          <div className="hidden lg:block">
            <SidebarToggle isOpen={isOpen} setIsOpen={toggleOpen} />
          </div>
          <BreadcrumbNavigation
            mode="auto"
            title={title}
            icon={icon}
            paramToPreserve="scanId"
          />
        </div>
        <div className="flex flex-1 items-center justify-end gap-3">
          <LanguageSwitcher />
          <ThemeSwitch />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
