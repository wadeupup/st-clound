import {
  CloudCog,
  Group,
  Mail,
  Settings,
  ShieldCheck,
  SquareChartGantt,
  Tag,
  Timer,
  User,
  UserCog,
  Users,
  Warehouse,
} from "lucide-react";

import { Translations } from "@/lib/i18n/index";
import { GroupProps } from "@/types";

interface MenuListOptions {
  pathname: string;
  t: Translations;
}

export const getMenuList = ({ pathname, t }: MenuListOptions): GroupProps[] => {
  return [
    {
      groupLabel: "",
      menus: [
        {
          href: "/",
          label: t.sidebar.overview,
          icon: SquareChartGantt,
          active: pathname === "/",
        },
      ],
    },
    {
      groupLabel: "",
      menus: [
        {
          href: "/compliance",
          label: t.sidebar.compliance,
          icon: ShieldCheck,
          active: pathname === "/compliance",
        },
      ],
    },
    {
      groupLabel: "",
      menus: [
        {
          href: "/findings?filter[muted]=false",
          label: t.sidebar.findings,
          icon: Tag,
        },
      ],
    },
    {
      groupLabel: "",
      menus: [
        {
          href: "/resources",
          label: t.sidebar.resources,
          icon: Warehouse,
        },
      ],
    },
    {
      groupLabel: "",
      menus: [
        {
          href: "",
          label: t.sidebar.configuration,
          icon: Settings,
          submenus: [
            {
              href: "/providers",
              label: t.sidebar.cloudProviders,
              icon: CloudCog,
            },
            {
              href: "/manage-groups",
              label: t.sidebar.providerGroups,
              icon: Group,
            },
            { href: "/scans", label: t.sidebar.scanJobs, icon: Timer },
          ],
          defaultOpen: true,
        },
      ],
    },
    {
      groupLabel: "",
      menus: [
        {
          href: "",
          label: t.sidebar.organization,
          icon: Users,
          submenus: [
            { href: "/users", label: t.sidebar.users, icon: User },
            { href: "/invitations", label: t.sidebar.invitations, icon: Mail },
            { href: "/roles", label: t.sidebar.roles, icon: UserCog },
          ],
          defaultOpen: false,
        },
      ],
    },
  ];
};
