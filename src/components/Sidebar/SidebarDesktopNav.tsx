"use client";

import Link from "next/link";
import { IconChevronDown } from "@tabler/icons-react";
import { cn } from "@/lib/cn";
import type { MenuConfigStatus } from "@/lib/auth/menuAccess";
import type { NavEntry, NavSubmenu } from "./nav";

export function SidebarDesktopNav({
  menuStatus,
  configured,
  notice,
  collapsed,
  entries,
  activeHref,
  activeGroupId,
  openOverride,
  onToggleGroup,
  isHidden,
  childrenOf,
}: {
  menuStatus: MenuConfigStatus;
  configured: boolean;
  notice: string | null;
  collapsed: boolean;
  entries: readonly NavEntry[];
  activeHref: string;
  activeGroupId: string | undefined;
  openOverride: Record<string, boolean>;
  onToggleGroup: (entryId: string, open: boolean) => void;
  isHidden: (entry: NavEntry) => boolean;
  childrenOf: (entry: NavSubmenu) => NavSubmenu["children"];
}) {
  if (menuStatus === "loading" && !configured) {
    return (
      <div aria-hidden className="flex flex-col gap-1">
        {[0, 1, 2, 3, 4].map((row) => (
          <div
            className={cn("h-9 animate-pulse rounded-md bg-tp-bg", collapsed && "w-full")}
            key={row}
          />
        ))}
      </div>
    );
  }

  if (notice) {
    return (
      <p
        className="px-2 py-1 text-sm text-tp-muted"
        role={menuStatus === "error" ? "alert" : undefined}
      >
        {notice}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1">
      {entries.map((entry) => {
        if (isHidden(entry)) return null;

        if (entry.kind === "link") {
          const active = activeHref === entry.href;
          return (
            <li key={entry.href}>
              <Link
                aria-current={active ? "page" : undefined}
                className="tp-nav-item"
                href={entry.href}
                title={collapsed ? entry.label : undefined}
              >
                <entry.icon aria-hidden className="h-[18px] w-[18px] shrink-0" />
                <span className={collapsed ? "sr-only" : "min-w-0 truncate"}>{entry.label}</span>
              </Link>
            </li>
          );
        }

        const children = childrenOf(entry);

        if (collapsed) {
          const first = children[0];
          if (!first) return null;
          return (
            <li key={entry.id}>
              <Link
                aria-current={activeGroupId === entry.id ? "page" : undefined}
                className="tp-nav-item"
                href={first.href}
                title={entry.label}
              >
                <entry.icon aria-hidden className="h-[18px] w-[18px] shrink-0" />
                <span className="sr-only">{entry.label}</span>
              </Link>
            </li>
          );
        }

        const open = openOverride[entry.id] ?? activeGroupId === entry.id;

        return (
          <li key={entry.id}>
            <button
              aria-controls={`nav-group-${entry.id}`}
              aria-expanded={open}
              className="tp-nav-item w-full"
              onClick={() => onToggleGroup(entry.id, open)}
              type="button"
            >
              <entry.icon aria-hidden className="h-[18px] w-[18px] shrink-0" />
              <span className="min-w-0 flex-1 truncate text-left">{entry.label}</span>
              <IconChevronDown
                aria-hidden
                className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")}
              />
            </button>
            {open ? (
              <ul
                className="ml-[22px] mt-0.5 flex flex-col gap-1 pl-2"
                id={`nav-group-${entry.id}`}
              >
                {children.map((child) => {
                  const active = activeHref === child.href;
                  return (
                    <li key={child.href}>
                      <Link
                        aria-current={active ? "page" : undefined}
                        className="tp-nav-item"
                        href={child.href}
                      >
                        <span className="min-w-0 truncate">{child.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
