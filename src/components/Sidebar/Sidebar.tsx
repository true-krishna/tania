"use client";

import * as React from "react";
import { IconLayoutSidebarLeftCollapse, IconLayoutSidebarLeftExpand } from "@tabler/icons-react";
import { Brand } from "@/components/Brand";
import { cn } from "@/lib/cn";
import type { AccessRole } from "@/generated/graphql";
import {
  defaultMenuAccessFor,
  type MenuAccessConfig,
  type MenuConfigStatus,
} from "@/lib/auth/menuAccess";
import {
  TALENT_NAV,
  navEntriesForRole,
  visibleNavEntries,
  type NavEntry,
  type NavSubmenu,
} from "./nav";
import { SidebarCompactNav } from "./SidebarCompactNav";
import { SidebarDesktopNav } from "./SidebarDesktopNav";

interface SidebarProps {
  role: AccessRole | null;
  pathname: string;
  menuConfig?: MenuAccessConfig | null;
  menuStatus?: MenuConfigStatus;
  roleName?: string | null;
  onRetryMenu?: () => void;
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

function resolveEntries(
  configured: boolean,
  menuConfig: MenuAccessConfig | null,
  roleName: string | null,
  role: AccessRole | null,
  menuStatus: MenuConfigStatus,
): readonly NavEntry[] {
  if (role === "TALENT") return TALENT_NAV;
  if (configured && menuConfig && roleName) return visibleNavEntries(menuConfig, roleName, role);
  if (menuStatus === "ready") return navEntriesForRole(role);
  return [];
}

function menuNoticeFor(menuStatus: MenuConfigStatus, entryCount: number): string | null {
  if (menuStatus === "error") return "Gagal memuat konfigurasi menu; menampilkan akses default";
  if (menuStatus === "empty" || entryCount === 0) return "Tidak ada menu untuk peran ini.";
  return null;
}

export function Sidebar({
  role,
  pathname,
  menuConfig = null,
  menuStatus = "ready",
  roleName = null,
  onRetryMenu,
}: SidebarProps) {
  const effectiveRoleName = roleName ?? role;
  const fallbackConfig =
    menuStatus === "error" ? defaultMenuAccessFor(effectiveRoleName, role) : null;
  const effectiveConfig = menuConfig ?? fallbackConfig;
  const configured = !!effectiveConfig && !!effectiveRoleName;
  const entries = React.useMemo(
    () => resolveEntries(configured, effectiveConfig, effectiveRoleName, role, menuStatus),
    [configured, effectiveConfig, menuStatus, effectiveRoleName, role],
  );
  const activeHref = useActiveHref(pathname, role, entries, !configured);
  const [openOverride, setOpenOverride] = React.useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = React.useState(false);

  const activeGroupId = entries.find(
    (entry): entry is NavSubmenu =>
      entry.kind === "group" && entry.children.some((child) => child.href === activeHref),
  )?.id;

  const hidden = (entry: NavEntry) => !configured && !!role && !entry.roles.includes(role);
  const childrenOf = (entry: NavSubmenu) => {
    if (configured) return entry.children;
    return entry.children.filter((child) => !role || child.roles.includes(role));
  };

  const menuNotice = menuNoticeFor(menuStatus, entries.length);

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
        <SidebarDesktopNav
          activeGroupId={activeGroupId}
          activeHref={activeHref}
          childrenOf={childrenOf}
          collapsed={collapsed}
          configured={configured}
          entries={entries}
          isHidden={hidden}
          menuStatus={menuStatus}
          notice={menuNotice}
          onRetry={onRetryMenu}
          onToggleGroup={(entryId, open) =>
            setOpenOverride((prev) => ({ ...prev, [entryId]: !open }))
          }
          openOverride={openOverride}
        />
      </nav>

      <nav
        aria-label="Main navigation (compact)"
        className="flex min-w-0 flex-1 flex-row items-center gap-1 overflow-x-auto min-[861px]:hidden"
      >
        <SidebarCompactNav
          activeHref={activeHref}
          childrenOf={childrenOf}
          configured={configured}
          entries={entries}
          isHidden={hidden}
          menuStatus={menuStatus}
          notice={menuNotice}
          onRetry={onRetryMenu}
        />
      </nav>
    </aside>
  );
}
