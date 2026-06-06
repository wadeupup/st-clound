"use client";

import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";

import { useSidebar } from "@/hooks/use-sidebar";
import { useStore } from "@/hooks/use-store";
import { cn } from "@/lib/utils";

import { Button } from "../button/button";
import { Menu } from "./menu";

import stLogo from "@/components/icons/compliance/st.png";

export function Sidebar() {
  const sidebar = useStore(useSidebar, (x) => x);
  if (!sidebar) return null;
  const { isOpen, getOpenState, setIsHover, settings } = sidebar;
  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-20 h-screen -translate-x-full transition-[width] duration-300 ease-in-out lg:translate-x-0",
        !getOpenState() ? "w-[90px]" : "w-72",
        settings.disabled && "hidden",
      )}
    >
      <div
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        className="no-scrollbar relative flex h-full flex-col overflow-x-hidden overflow-y-auto border-r border-slate-200 bg-white/80 backdrop-blur-sm shadow-lg dark:border-slate-800 dark:bg-slate-900/80 px-3 py-6"
      >
        <Button
          className={cn(
            "mb-1 transition-transform duration-300 ease-in-out",
            !getOpenState() ? "translate-x-1" : "translate-x-0",
          )}
          variant="link"
          asChild
        >
          <Link
            href="/"
            className={clsx(
              "mb-6 flex w-full items-center justify-center px-3",
              {
                "flex-col gap-0": !getOpenState(),
                "flex-row gap-3": getOpenState(),
              },
            )}
          >
            <Image
              src={stLogo}
              alt="ST Cloud"
              width={getOpenState() ? 40 : 30}
              height={getOpenState() ? 40 : 30}
              className="object-contain flex-shrink-0"
            />
            {getOpenState() && (
              <span className="text-lg font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                ST Cloud
              </span>
            )}
          </Link>
        </Button>

        <Menu isOpen={getOpenState()} />
      </div>
    </aside>
  );
}
