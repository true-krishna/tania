"use client";

import Link from "next/link";
import * as React from "react";
import { IconChevronDown, IconLogout, type TablerIcon } from "@tabler/icons-react";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/Avatar";

export interface UserMenuItem {
  href: string;
  label: string;
  icon: TablerIcon;
}

interface UserMenuProps {
  name: string;
  email?: string | null;
  roleLabel?: string | null;
  items?: readonly UserMenuItem[];
  onLogout: () => void;
}

export function UserMenu({ name, email, roleLabel, items = [], onLogout }: UserMenuProps) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const menuId = React.useId();
  const secondary = email?.trim() || roleLabel?.trim() || null;

  React.useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        aria-controls={menuId}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Menu akun: ${name.trim() || "?"}`}
        className={cn(
          "flex items-center gap-2.5 rounded-full p-1 text-left transition-colors",
          open ? "bg-tp-bg" : "hover:bg-tp-bg",
        )}
        onClick={() => setOpen((value) => !value)}
        ref={triggerRef}
        type="button"
      >
        <Avatar name={name} />
        <span className="hidden flex-col leading-tight sm:flex">
          <span className="max-w-[14rem] truncate text-sm font-medium text-tp-text">{name}</span>
          <span className="text-[11px] text-tp-muted">{secondary ?? "—"}</span>
        </span>
        <IconChevronDown
          aria-hidden
          className={cn(
            "hidden h-4 w-4 shrink-0 text-tp-muted transition-transform sm:block",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div
          className="absolute right-0 top-[calc(100%+8px)] z-20 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-tp-lg border border-tp-line bg-tp-surface shadow-card"
          id={menuId}
        >
          <div className="flex items-center gap-3 bg-tp-bg px-4 py-3.5">
            <Avatar name={name} />
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="block truncate text-sm font-semibold text-tp-text">{name}</span>
              <span className="block truncate text-xs text-tp-muted">{secondary ?? "—"}</span>
            </div>
          </div>

          <ul className="flex flex-col p-1.5">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  className="flex items-center gap-2.5 rounded-tp-sm px-3 py-2 text-sm font-semibold text-tp-text transition-colors hover:bg-tp-bg"
                  href={item.href}
                  onClick={() => setOpen(false)}
                >
                  <item.icon aria-hidden className="h-[18px] w-[18px] shrink-0" />
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="mt-1.5 border-t border-tp-line pt-1.5">
              <button
                className="flex w-full items-center gap-2.5 rounded-tp-sm px-3 py-2 text-sm font-semibold text-tp-ink-peach transition-colors hover:bg-tp-tint-peach"
                onClick={() => {
                  setOpen(false);
                  onLogout();
                }}
                type="button"
              >
                <IconLogout aria-hidden className="h-[18px] w-[18px] shrink-0" />
                Keluar
              </button>
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}
