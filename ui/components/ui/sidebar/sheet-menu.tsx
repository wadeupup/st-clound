import { MenuIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "@/components/ui/sidebar/menu";

import { Button } from "../button/button";

import stLogo from "@/components/icons/compliance/st.png";

export function SheetMenu() {
  return (
    <Sheet>
      <SheetTrigger className="lg:hidden" asChild>
        <Button className="h-9 w-9 border-slate-300 bg-white/50 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:bg-slate-800" variant="outline" size="icon">
          <MenuIcon size={20} className="text-slate-600 dark:text-slate-400" />
        </Button>
      </SheetTrigger>
      <SheetContent className="flex h-full flex-col border-r border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80 px-3 sm:w-72" side="left">
        <SheetHeader>
          <SheetTitle className="sr-only">Sidebar</SheetTitle>
          <SheetDescription className="sr-only" />
          <Button
            className="flex items-center justify-center pt-1 pb-2"
            variant="link"
            asChild
          >
            <Link href="/" className="flex items-center gap-3">
              <Image
                src={stLogo}
                alt="ST Cloud"
                width={40}
                height={40}
                className="object-contain flex-shrink-0"
              />
              <span className="text-lg font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                ST Cloud
              </span>
            </Link>
          </Button>
        </SheetHeader>
        <Menu isOpen />
      </SheetContent>
    </Sheet>
  );
}
