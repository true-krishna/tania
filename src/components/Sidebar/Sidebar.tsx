"use client";

import Link from "next/link";
import * as React from "react";
import {
  IconChevronDown,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
} from "@tabler/icons-react";
import { Brand } from "@/components/Brand";
import { cn } from "@/lib/cn";
import type { AccessRole } from "@/generated/graphql";
import { NAV, type NavSubmenu } from "./nav";

interface SidebarProps {
  role: AccessRole | null;
  pathname: string;
}

/**
 * App shell per constitution-design v4.0.0 §VIII: sticky 268px sidebar on
 * desktop (≥861px) using the shipped `.tp-nav-item` state model; below 860px
 * it collapses to a static horizontal strip with a scrollable nav row.
 * Desktop-only toggle (TAN-171) minimizes the sidebar to an icon-only rail:
 * labels stay in the DOM as `.sr-only`, and multi-page sections link to their
 * first visible child instead of expanding a submenu.
 */

/** Longest visible href matching the path wins, so `/evaluations` does not also light up on `/evaluations/my`. */
function useActiveHref(pathname: string, role: AccessRole | null): string {
  return React.useMemo(() => {
    let best = "";
    for (const entry of NAV) {
      if (role && !entry.roles.includes(role)) continue;
      const hrefs = entry.kind === "link" ? [entry.href] : entry.children.filter((c) => !role || c.roles.includes(role)).map((c) => c.href);
      for (const href of hrefs) {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        if (active && href.length > best.length) best = href;
      }
    }
    return best;
  }, [pathname, role]);
}

export function Sidebar({ role, pathname }: SidebarProps) {
  const activeHref = useActiveHref(pathname, role);
  // User toggles override the default (the submenu owning the current route).
  const [openOverride, setOpenOverride] = React.useState<Record<string, boolean>>({});
  // TAN-171: desktop-only minimize. The mobile strip (≤860px) is unaffected.
  const [collapsed, setCollapsed] = React.useState(false);

  const activeGroupId = NAV.find(
    (entry): entry is NavSubmenu =>
      entry.kind === "group" && entry.children.some((child) => child.href === activeHref),
  )?.id;

  const toggle = (
    <button
      type="button"
      onClick={() => setCollapsed((value) => !value)}
      aria-controls="app-sidebar"
      aria-expanded={!collapsed}
      aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
      title={collapsed ? "Expand navigation" : "Collapse navigation"}
      className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-md text-tp-muted transition-colors hover:bg-tp-bg hover:text-tp-text min-[861px]:inline-flex"
    >
      {collapsed ? (
        <IconLayoutSidebarLeftExpand className="h-[18px] w-[18px]" aria-hidden />
      ) : (
        <IconLayoutSidebarLeftCollapse className="h-[18px] w-[18px]" aria-hidden />
      )}
    </button>
  );

  const brand = (
    <div className={cn("flex shrink-0 flex-col gap-1", collapsed && "min-[861px]:hidden")}>
      <Brand variant="large" className="text-[36px]" />
      <span className="hidden truncate text-[11px] text-tp-muted min-[861px]:block">
        Talent Management
      </span>
    </div>
  );

  return (
    <aside
      id="app-sidebar"
      className={cn(
        "static flex w-auto shrink-0 flex-row items-center gap-0 border-b border-tp-line bg-tp-surface px-4 py-[14px] min-[861px]:sticky min-[861px]:top-0 min-[861px]:h-screen min-[861px]:shrink-0 min-[861px]:flex-col min-[861px]:items-stretch min-[861px]:gap-[22px] min-[861px]:border-r min-[861px]:border-b-0 min-[861px]:bg-tp-surface min-[861px]:px-4 min-[861px]:py-[22px] min-[861px]:transition-[width] min-[861px]:duration-200",
        collapsed ? "min-[861px]:w-[78px]" : "min-[861px]:w-[268px]",
      )}
    >
      <div className={cn("flex items-center gap-2", collapsed && "min-[861px]:justify-center")}>
        {toggle}
        {brand}
      </div>

      {/* Desktop: vertical nav with expandable submenus. */}
      <nav aria-label="Main navigation" className="hidden min-w-0 flex-1 flex-col overflow-y-auto min-[861px]:flex">
        <ul className="flex flex-col gap-1">
          {NAV.map((entry) => {
            if (role && !entry.roles.includes(role)) return null;

            if (entry.kind === "link") {
              const active = activeHref === entry.href;
              return (
                <li key={entry.href}>
                  <Link
                    href={entry.href}
                    aria-current={active ? "page" : undefined}
                    title={collapsed ? entry.label : undefined}
                    className="tp-nav-item"
                  >
                    <entry.icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                    <span className={collapsed ? "sr-only" : "min-w-0 truncate"}>{entry.label}</span>
                  </Link>
                </li>
              );
            }

            const children = entry.children.filter((child) => !role || child.roles.includes(role));

            if (collapsed) {
              // Icon-only rail: a section cannot expand, so it links to its first
              // visible child and lights up while any of its pages is current.
              const first = children[0];
              if (!first) return null;
              return (
                <li key={entry.id}>
                  <Link
                    href={first.href}
                    aria-current={activeGroupId === entry.id ? "page" : undefined}
                    title={entry.label}
                    className="tp-nav-item"
                  >
                    <entry.icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                    <span className="sr-only">{entry.label}</span>
                  </Link>
                </li>
              );
            }

            const open = openOverride[entry.id] ?? activeGroupId === entry.id;

            return (
              <li key={entry.id}>
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={`nav-group-${entry.id}`}
                  onClick={() => setOpenOverride((prev) => ({ ...prev, [entry.id]: !open }))}
                  className="tp-nav-item w-full"
                >
                  <entry.icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-left">{entry.label}</span>
                  <IconChevronDown
                    className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")}
                    aria-hidden
                  />
                </button>
                {open ? (
                  <ul
                    id={`nav-group-${entry.id}`}
                    className="ml-[22px] mt-0.5 flex flex-col gap-1 pl-2"
                  >
                    {children.map((child) => {
                      const active = activeHref === child.href;
                      return (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            aria-current={active ? "page" : undefined}
                            className="tp-nav-item"
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
      </nav>

      {/* ≤860px: static horizontal strip — flat, horizontally scrollable nav row. */}
      <nav
        aria-label="Main navigation (compact)"
        className="flex min-w-0 flex-1 flex-row items-center gap-1 overflow-x-auto min-[861px]:hidden"
      >
        {NAV.map((entry) => {
          if (role && !entry.roles.includes(role)) return null;

          if (entry.kind === "link") {
            const active = activeHref === entry.href;
            return (
              <Link
                key={entry.href}
                href={entry.href}
                aria-current={active ? "page" : undefined}
                className="tp-nav-item flex-none"
              >
                <entry.icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                <span className="whitespace-nowrap">{entry.label}</span>
              </Link>
            );
          }

          const children = entry.children.filter((child) => !role || child.roles.includes(role));
          if (children.length === 0) return null;

          return (
            <React.Fragment key={entry.id}>
              <span className="flex-none whitespace-nowrap px-2 text-tp-muted">{entry.label}</span>
              {children.map((child) => {
                const active = activeHref === child.href;
                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    aria-current={active ? "page" : undefined}
                    className="tp-nav-item flex-none"
                  >
                    <span className="whitespace-nowrap">{child.label}</span>
                  </Link>
                );
              })}
            </React.Fragment>
          );
        })}
      </nav>
    </aside>
  );
}
