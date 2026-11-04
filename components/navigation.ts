import {
  BookOpen,
  ChartNoAxesColumn,
  House,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const navigationItems: NavigationItem[] = [
  { href: "/", label: "Today", icon: House },
  { href: "/progress", label: "Progress", icon: ChartNoAxesColumn },
  { href: "/words", label: "Words", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
