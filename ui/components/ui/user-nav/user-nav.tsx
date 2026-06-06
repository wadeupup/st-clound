"use client";

import { LogOut } from "lucide-react";
import { useSession } from "next-auth/react";

import { logOut } from "@/actions/auth";
import { Button } from "@/components/shadcn/button/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/shadcn/tooltip";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar/avatar";
import { CustomLink } from "@/components/ui/custom/custom-link";

export const UserNav = () => {
  const { data: session } = useSession();

  if (!session?.user) return null;

  const { name } = session.user;

  const initials = name.includes(" ")
    ? name
        .split(" ")
        .map((word) => word.charAt(0))
        .join("")
    : name.charAt(0);

  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon-sm"
            className="h-9 w-9 rounded-full border-slate-300 bg-white/50 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:bg-slate-800"
            asChild
          >
            <CustomLink href="/profile" target="_self" aria-label="Account">
              <Avatar className="h-7 w-7">
                <AvatarImage src="#" alt="Avatar" />
                <AvatarFallback className="bg-slate-200 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </CustomLink>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Account Settings</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-9 w-9 rounded-full border-slate-300/50 hover:bg-slate-100 hover:border-slate-300 dark:border-slate-700/50 dark:hover:bg-slate-800 dark:hover:border-slate-600"
            onClick={() => logOut()}
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Sign Out</TooltipContent>
      </Tooltip>
    </div>
  );
};
