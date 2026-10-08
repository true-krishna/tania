"use client";

import Link from "next/link";
import * as React from "react";
import { IconChevronDown, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { cn } from "@/lib/cn";
import type { AccessRole } from "@/generated/graphql";
import { SIDEBAR_WIDTH_COLLAPSED, SIDEBAR_WIDTH_EXPANDED } from "@/lib/sidebar-state";
import { NAV, type NavSubmenu } from "./nav";

interface SidebarProps {
  role: AccessRole | null;
  pathname: string;
  /** Minimised rail (icons only) vs. full sidebar (icon + label). */
  collapsed: boolean;
  onToggle: () => void;
}

const LINK_BASE =
  "relative flex items-center gap-3 rounded-lg border-l-4 border-transparent py-2 text-sm font-medium transition-colors";
const LINK_INACTIVE = "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-fg";
const LINK_ACTIVE = "border-brand bg-sidebar-active text-sidebar-active-fg";

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

export function Sidebar({ role, pathname, collapsed, onToggle }: SidebarProps) {
  const activeHref = useActiveHref(pathname, role);
  // User toggles override the default (the submenu owning the current route).
  const [openOverride, setOpenOverride] = React.useState<Record<string, boolean>>({});

  const activeGroupId = NAV.find(
    (entry): entry is NavSubmenu =>
      entry.kind === "group" && entry.children.some((child) => child.href === activeHref),
  )?.id;

  const itemClass = (active: boolean) =>
    cn(
      LINK_BASE,
      collapsed ? "justify-center px-2" : "px-3",
      active ? LINK_ACTIVE : LINK_INACTIVE,
    );

  return (
    <aside
      id="app-sidebar"
      style={{ width: collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED }}
      className="fixed inset-y-0 left-0 z-20 flex flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200"
    >
      <div className={cn("flex items-center gap-2.5 py-4", collapsed ? "justify-center px-2" : "px-4")}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-sm font-bold text-white shadow-sm">
          T
        </span>
        {collapsed ? null : (
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-semibold tracking-tight text-zinc-900">Tania</span>
            <span className="truncate text-[11px] text-zinc-400">Talent Management</span>
          </span>
        )}
      </div>

      <nav aria-label="Main navigation" className={cn("flex-1 overflow-y-auto pb-4", collapsed ? "px-2" : "px-2.5")}>
        <ul className="flex flex-col gap-0.5">
          {NAV.map((entry) => {
            if (role && !entry.roles.includes(role)) return null;

            if (entry.kind === "link") {
              const active = activeHref === entry.href;
              return (
                <li key={entry.href}>
                  <Link
                    href={entry.href}
                    aria-current={active ? "page" : undefined}
                    aria-label={collapsed ? entry.label : undefined}
                    title={collapsed ? entry.label : undefined}
                    className={itemClass(active)}
                  >
                    <entry.icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                    {collapsed ? null : <span className="truncate">{entry.label}</span>}
                  </Link>
                </li>
              );
            }

            const children = entry.children.filter((child) => !role || child.roles.includes(role));
            const open = !collapsed && (openOverride[entry.id] ?? activeGroupId === entry.id);
            const groupActive = children.some((child) => child.href === activeHref);

            return (
              <li key={entry.id}>
                <button
                  type="button"
                  aria-expanded={collapsed ? false : open}
                  aria-controls={`nav-group-${entry.id}`}
                  aria-label={collapsed ? entry.label : undefined}
                  title={collapsed ? `${entry.label} — expand navigation` : undefined}
                  onClick={() => {
                    // No room for a submenu in the rail: expand, then open the group.
                    if (collapsed) {
                      onToggle();
                      setOpenOverride((prev) => ({ ...prev, [entry.id]: true }));
                      return;
                    }
                    setOpenOverride((prev) => ({ ...prev, [entry.id]: !open }));
                  }}
                  className={cn(itemClass(groupActive), "w-full")}
                >
                  <entry.icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                  {collapsed ? null : (
                    <>
                      <span className="flex-1 truncate text-left">{entry.label}</span>
                      <IconChevronDown
                        className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")}
                        aria-hidden
                      />
                    </>
                  )}
                </button>
                {open ? (
                  <ul
                    id={`nav-group-${entry.id}`}
                    className="mt-0.5 ml-[22px] flex flex-col gap-0.5 pl-2"
                  >
                    {children.map((child) => {
                      const active = activeHref === child.href;
                      return (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                              "block rounded-md border-l-4 border-transparent px-3 py-1.5 text-sm transition-colors",
                              active
                                ? "border-brand bg-sidebar-active font-medium text-sidebar-active-fg"
                                : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-fg",
                            )}
                          >
                            {child.label}
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

      <div className={cn("border-t border-sidebar-border p-2", collapsed && "flex justify-center")}>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!collapsed}
          aria-controls="app-sidebar"
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          title={collapsed ? "Expand navigation" : "Collapse navigation"}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg text-sm font-medium text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-fg",
            collapsed ? "h-9 w-9 justify-center" : "w-full px-3 py-2",
          )}
        >
          {collapsed ? (
            <IconChevronRight className="h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <IconChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
          )}
          {collapsed ? null : <span className="truncate">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}