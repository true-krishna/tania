"use client";

import Link from "next/link";
import * as React from "react";
import { Icon } from "@/components/Icon";
import { cn } from "@/lib/cn";
import type { AccessRole } from "@/generated/graphql";
import {
  DEFAULT_SIDEBAR_WIDTH,
  MAX_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
  clampSidebarWidth,
} from "@/lib/sidebar-width";
import { NAV, type NavSubmenu } from "./nav";

interface SidebarProps {
  role: AccessRole | null;
  pathname: string;
  width: number;
  onWidthChange: (width: number) => void;
}

const LINK_BASE =
  "relative flex items-center gap-3 rounded-lg border-l-4 border-transparent px-3 py-2 text-sm font-medium transition-colors";
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

export function Sidebar({ role, pathname, width, onWidthChange }: SidebarProps) {
  const activeHref = useActiveHref(pathname, role);
  // User toggles override the default (the submenu owning the current route).
  const [openOverride, setOpenOverride] = React.useState<Record<string, boolean>>({});
  const [dragging, setDragging] = React.useState(false);
  const dragRef = React.useRef<{ startX: number; startWidth: number } | null>(null);

  const activeGroupId = NAV.find(
    (entry): entry is NavSubmenu =>
      entry.kind === "group" && entry.children.some((child) => child.href === activeHref),
  )?.id;

  React.useEffect(() => {
    if (!dragging) return;
    const previous = document.body.style.userSelect;
    document.body.style.userSelect = "none";
    return () => {
      document.body.style.userSelect = previous;
    };
  }, [dragging]);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    dragRef.current = { startX: event.clientX, startWidth: width };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    onWidthChange(clampSidebarWidth(drag.startWidth + event.clientX - drag.startX));
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    dragRef.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 40 : 16;
    const keys: Record<string, number> = {
      ArrowLeft: width - step,
      ArrowRight: width + step,
      Home: MIN_SIDEBAR_WIDTH,
      End: MAX_SIDEBAR_WIDTH,
    };
    if (!(event.key in keys)) return;
    event.preventDefault();
    onWidthChange(clampSidebarWidth(keys[event.key]));
  }

  return (
    <aside
      id="app-sidebar"
      style={{ width }}
      className="fixed inset-y-0 left-0 z-20 flex flex-col border-r border-sidebar-border bg-sidebar"
    >
      <div className="flex items-center gap-2.5 px-4 py-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-sm font-bold text-white shadow-sm">
          T
        </span>
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-sm font-semibold tracking-tight text-zinc-900">Tania</span>
          <span className="truncate text-[11px] text-zinc-400">Talent Management</span>
        </span>
      </div>

      <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-2.5 pb-4">
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
                    className={cn(LINK_BASE, active ? LINK_ACTIVE : LINK_INACTIVE)}
                  >
                    <Icon name={entry.icon} className="h-[18px] w-[18px] shrink-0" />
                    <span className="truncate">{entry.label}</span>
                  </Link>
                </li>
              );
            }

            const children = entry.children.filter((child) => !role || child.roles.includes(role));
            const open = openOverride[entry.id] ?? activeGroupId === entry.id;
            const groupActive = children.some((child) => child.href === activeHref);

            return (
              <li key={entry.id}>
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={`nav-group-${entry.id}`}
                  onClick={() => setOpenOverride((prev) => ({ ...prev, [entry.id]: !open }))}
                  className={cn(
                    LINK_BASE,
                    "w-full",
                    groupActive ? LINK_ACTIVE : LINK_INACTIVE,
                  )}
                >
                  <Icon name={entry.icon} className="h-[18px] w-[18px] shrink-0" />
                  <span className="flex-1 truncate text-left">{entry.label}</span>
                  <Icon
                    name="chevronDown"
                    className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")}
                  />
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

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize navigation"
        aria-controls="app-sidebar"
        aria-valuemin={MIN_SIDEBAR_WIDTH}
        aria-valuemax={MAX_SIDEBAR_WIDTH}
        aria-valuenow={Math.round(width)}
        tabIndex={0}
        title="Drag to resize · double-click to reset"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={() => onWidthChange(DEFAULT_SIDEBAR_WIDTH)}
        onKeyDown={handleKeyDown}
        className={cn(
          "group absolute inset-y-0 right-0 flex w-2 translate-x-1/2 cursor-col-resize touch-none items-center justify-center focus:outline-none",
          dragging && "cursor-col-resize",
        )}
      >
        <span
          className={cn(
            "flex h-8 w-1 items-center justify-center rounded-full transition-colors",
            dragging ? "bg-brand" : "bg-transparent group-hover:bg-sidebar-border group-focus-visible:bg-brand",
          )}
        />
        <Icon
          name="resize"
          className={cn(
            "absolute h-4 w-4 text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100",
            dragging && "text-brand opacity-100",
          )}
        />
      </div>
    </aside>
  );
}