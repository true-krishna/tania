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
import type { MenuAccessConfig, MenuConfigStatus } from "@/lib/auth/menuAccess";
import { NAV, visibleNavEntries, type NavEntry, type NavSubmenu } from "./nav";

interface SidebarProps {
  role: AccessRole | null;
  pathname: string;
  menuConfig?: MenuAccessConfig | null;
  menuStatus?: MenuConfigStatus;
  roleName?: string | null;
}

function useActiveHref(
  pathname: string,
  role: AccessRole | null,
  entries: readonly NavEntry[],
  roleScoped: boolean,
): string {
  return React.useMemo(() => {
    let best = "";
    for (const entry of entries) {
      if (roleScoped && role && !entry.roles.includes(role)) continue;
      const hrefs =
        entry.kind === "link"
          ? [entry.href]
          : entry.children
              .filter((c) => !roleScoped || !role || c.roles.includes(role))
              .map((c) => c.href);
      for (const href of hrefs) {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        if (active && href.length > best.length) best = href;
      }
    }
    return best;
  }, [pathname, role, entries, roleScoped]);
}

export function Sidebar({
  role,
  pathname,
  menuConfig = null,
  menuStatus = "ready",
  roleName = null,
}: SidebarProps) {
  const configured = !!menuConfig && !!roleName;
  const entries = React.useMemo(
    () =>
      configured ? visibleNavEntries(menuConfig, roleName) : menuStatus === "ready" ? NAV : [],
    [configured, menuConfig, menuStatus, roleName],
  );
  const activeHref = useActiveHref(pathname, role, entries, !configured);
  const [openOverride, setOpenOverride] = React.useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = React.useState(false);

  const activeGroupId = entries.find(
    (entry): entry is NavSubmenu =>
      entry.kind === "group" && entry.children.some((child) => child.href === activeHref),
  )?.id;

  const hidden = (entry: NavEntry) => !configured && !!role && !entry.roles.includes(role);
  const childrenOf = (entry: NavSubmenu) =>
    configured
      ? entry.children
      : entry.children.filter((child) => !role || child.roles.includes(role));

  const menuNotice =
    menuStatus === "error"
      ? "Gagal memuat menu akses. Muat ulang halaman untuk mencoba lagi."
      : entries.length === 0
        ? "Tidak ada menu untuk peran ini."
        : null;

  const toggle = (
    <button
      aria-controls="app-sidebar"
      aria-expanded={!collapsed}
      aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
      className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-md text-tp-muted transition-colors hover:bg-tp-bg hover:text-tp-text min-[861px]:inline-flex"
      onClick={() => setCollapsed((value) => !value)}
      title={collapsed ? "Expand navigation" : "Collapse navigation"}
      type="button"
    >
      {collapsed ? (
        <IconLayoutSidebarLeftExpand aria-hidden className="h-[18px] w-[18px]" />
      ) : (
        <IconLayoutSidebarLeftCollapse aria-hidden className="h-[18px] w-[18px]" />
      )}
    </button>
  );

  const brand = (
    <div className={cn("flex shrink-0 flex-col gap-1", collapsed && "min-[861px]:hidden")}>
      <Brand className="text-[36px]" variant="large" />
      <span className="hidden truncate text-[11px] text-tp-muted min-[861px]:block">
        Talent Management
      </span>
    </div>
  );

  return (
    <aside
      className={cn(
        "static flex w-auto shrink-0 flex-row items-center gap-0 border-b border-tp-line bg-tp-surface px-4 py-[14px] min-[861px]:sticky min-[861px]:top-0 min-[861px]:h-screen min-[861px]:shrink-0 min-[861px]:flex-col min-[861px]:items-stretch min-[861px]:gap-[22px] min-[861px]:border-r min-[861px]:border-b-0 min-[861px]:bg-tp-surface min-[861px]:px-4 min-[861px]:py-[22px] min-[861px]:transition-[width] min-[861px]:duration-200",
        collapsed ? "min-[861px]:w-[78px]" : "min-[861px]:w-[268px]",
      )}
      id="app-sidebar"
    >
      <div className={cn("flex items-center gap-2", collapsed && "min-[861px]:justify-center")}>
        {toggle}
        {brand}
      </div>

      <nav
        aria-label="Main navigation"
        className="hidden min-w-0 flex-1 flex-col overflow-y-auto min-[861px]:flex"
      >
        {menuStatus === "loading" && !configured ? (
          <div aria-hidden className="flex flex-col gap-1">
            {[0, 1, 2, 3, 4].map((row) => (
              <div
                className={cn("h-9 animate-pulse rounded-md bg-tp-bg", collapsed && "w-full")}
                key={row}
              />
            ))}
          </div>
        ) : menuNotice ? (
          <p
            className="px-2 py-1 text-sm text-tp-muted"
            role={menuStatus === "error" ? "alert" : undefined}
          >
            {menuNotice}
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {entries.map((entry) => {
              if (hidden(entry)) return null;

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
                      <span className={collapsed ? "sr-only" : "min-w-0 truncate"}>
                        {entry.label}
                      </span>
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
                    onClick={() => setOpenOverride((prev) => ({ ...prev, [entry.id]: !open }))}
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
        )}
      </nav>

      <nav
        aria-label="Main navigation (compact)"
        className="flex min-w-0 flex-1 flex-row items-center gap-1 overflow-x-auto min-[861px]:hidden"
      >
        {menuStatus === "loading" && !configured ? (
          <span className="flex-none animate-pulse px-2 text-sm text-tp-muted" role="status">
            Memuat menu…
          </span>
        ) : menuNotice ? (
          <span
            className="flex-none whitespace-nowrap px-2 text-sm text-tp-muted"
            role={menuStatus === "error" ? "alert" : undefined}
          >
            {menuStatus === "error" ? "Menu akses gagal dimuat." : menuNotice}
          </span>
        ) : (
          entries.map((entry) => {
            if (hidden(entry)) return null;

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
                <span className="flex-none whitespace-nowrap px-2 text-tp-muted">
                  {entry.label}
                </span>
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
          })
        )}
      </nav>
    </aside>
  );
}
