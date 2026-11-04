"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActivePath, navigationItems } from "./navigation";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto grid w-full max-w-[560px] grid-cols-4">
        {navigationItems.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary ${
                  active ? "text-primary" : "text-muted hover:text-ink"
                }`}
              >
                <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
