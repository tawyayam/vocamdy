"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActivePath, navigationItems } from "./navigation";

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-border bg-card px-4 py-6 lg:flex">
      <Link
        href="/"
        className="flex items-center gap-3 rounded-xl px-2 py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <Image
          src="/icons/logo-1024.png"
          alt=""
          width={40}
          height={40}
          className="h-10 w-10 rounded-xl"
        />
        <span className="font-serif text-2xl font-semibold text-ink">
          Vocamdy
        </span>
      </Link>
      <nav aria-label="Main navigation" className="mt-8">
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                    active
                      ? "bg-primary-soft text-primary"
                      : "text-muted hover:bg-paper hover:text-ink"
                  }`}
                >
                  <Icon
                    aria-hidden="true"
                    className="h-5 w-5"
                    strokeWidth={1.8}
                  />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
