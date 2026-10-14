"use client";

import { IconDotsVertical } from "@tabler/icons-react";
import { cn } from "@/lib/cn";
import * as React from "react";

export interface RowAction {
  label: string;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface RowActionsMenuProps {
  label: string;
  actions?: readonly RowAction[];
  /** Konten tambahan di atas daftar aksi (mis. kontrol ubah peran). */
  children?: React.ReactNode;
}

interface MenuPosition {
  top?: number;
  bottom?: number;
  right: number;
}

/**
 * Menu aksi baris tabel (TAN-184): ikon tiga titik yang membuka daftar opsi.
 * Pola disclosure seperti UserMenu (bukan role="menu"). Panel memakai
 * `position: fixed` mengikuti posisi trigger karena `.table-scroll` memotong
 * dropdown absolut, dan menutup saat scroll/resize agar posisinya tak pernah basi.
 */
export function RowActionsMenu({ label, actions = [], children }: RowActionsMenuProps) {
  const [open, setOpen] = React.useState(false);
  const [position, setPosition] = React.useState<MenuPosition | null>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const menuId = React.useId();

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      const openUp = rect.bottom + 180 > window.innerHeight;
      setPosition({
        top: openUp ? undefined : rect.bottom + 4,
        bottom: openUp ? window.innerHeight - rect.top + 4 : undefined,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    }
    setOpen(true);
  }

  React.useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;
      // Interaksi popup native <select> kadang dilaporkan di luar root.
      if (event.target instanceof Element && event.target.closest("select, option")) return;
      setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    function onViewportChange() {
      setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onViewportChange, true);
    window.addEventListener("resize", onViewportChange);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onViewportChange, true);
      window.removeEventListener("resize", onViewportChange);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={toggle}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-tp-muted transition-colors hover:bg-tp-bg hover:text-tp-text"
      >
        <IconDotsVertical aria-hidden size={18} stroke={2} />
      </button>

      {open ? (
        <div
          id={menuId}
          style={position ? { position: "fixed", top: position.top, bottom: position.bottom, right: position.right } : undefined}
          className={cn(
            "z-30 min-w-56 max-w-64 overflow-hidden rounded-tp-lg border border-tp-line bg-tp-surface shadow-card",
            !position && "absolute right-0 top-full mt-1",
          )}
        >
          {children ? <div className="border-b border-tp-line p-3">{children}</div> : null}
          {actions.length > 0 ? (
            <ul className="flex flex-col p-1.5">
              {actions.map((action) => (
                <li key={action.label}>
                  <button
                    type="button"
                    disabled={action.disabled}
                    onClick={() => {
                      setOpen(false);
                      action.onSelect();
                    }}
                    className={cn(
                      "flex w-full items-center rounded-tp-sm px-3 py-2 text-left text-sm font-semibold text-tp-text transition-colors hover:bg-tp-bg",
                      "disabled:pointer-events-none disabled:opacity-50",
                      action.danger && "text-tp-ink-peach hover:bg-tp-tint-peach",
                    )}
                  >
                    {action.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
