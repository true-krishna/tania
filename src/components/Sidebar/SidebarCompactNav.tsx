"use client";

import Link from "next/link";
import * as React from "react";
import type { MenuConfigStatus } from "@/lib/auth/menuAccess";
import type { NavEntry, NavSubmenu } from "./nav";

export function SidebarCompactNav({
  menuStatus,
  configured,
  notice,
  entries,
  activeHref,
  isHidden,
  childrenOf,
}: {
  menuStatus: MenuConfigStatus;
  configured: boolean;
  notice: string | null;
  entries: readonly NavEntry[];
  activeHref: string;
  isHidden: (entry: NavEntry) => boolean;
  childrenOf: (entry: NavSubmenu) => NavSubmenu["children"];
}) {
  if (menuStatus === "loading" && !configured) {
    return (
      <span className="flex-none animate-pulse px-2 text-sm text-tp-muted" role="status">
        Memuat menu…
      </span>
    );
  }

  if (notice) {
    return (
      <span
        className="flex-none whitespace-nowrap px-2 text-sm text-tp-muted"
        role={menuStatus === "error" ? "alert" : undefined}
      >
        {menuStatus === "error" ? "Menu akses gagal dimuat." : notice}
      </span>
    );
  }

  return entries.map((entry) => {
    if (isHidden(entry)) return null;

    if (entry.kind === "link") {
      const active = activeHref === entry.href;
      return (
        <Link
          aria-current={active ? "page" : undefined}
          className="tp-nav-item flex-none"
          href={entry.href}
          key={entry.href}
        >
          <entry.icon aria-hidden className="h-[18px] w-[18px] shrink-0" />
          <span className="whitespace-nowrap">{entry.label}</span>
        </Link>
      );
    }

    const children = childrenOf(entry);
    if (children.length === 0) return null;

    return (
      <React.Fragment key={entry.id}>
        <span className="flex-none whitespace-nowrap px-2 text-tp-muted">{entry.label}</span>
        {children.map((child) => {
          const active = activeHref === child.href;
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className="tp-nav-item flex-none"
              href={child.href}
              key={child.href}
            >
              <span className="whitespace-nowrap">{child.label}</span>
            </Link>
          );
        })}
      </React.Fragment>
    );
  });
}
