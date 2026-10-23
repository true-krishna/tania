"use client";

import { cn } from "@/lib/cn";
import { IconX } from "@tabler/icons-react";
import * as React from "react";

export type ModalSize = "sm" | "md" | "lg";

export interface ModalFooterAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
}

const SIZES: Record<ModalSize, string> = {
  sm: "w-[420px]",
  md: "w-[560px]",
  lg: "w-[720px]",
};

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  size?: ModalSize;
  children: React.ReactNode;
  footerActions?: ModalFooterAction[];
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  size = "md",
  children,
  footerActions = [],
  triggerRef,
}: ModalProps) {
  const dialogRef = React.useRef<HTMLDivElement | null>(null);
  const titleId = React.useId();
  const subtitleId = React.useId();
  const previousActiveElementRef = React.useRef<HTMLElement | null>(null);

  const closeAndRestoreFocus = React.useCallback(() => {
    onClose();
    const target = triggerRef?.current ?? previousActiveElementRef.current;
    target?.focus();
  }, [onClose, triggerRef]);

  React.useEffect(() => {
    if (!open) return;
    previousActiveElementRef.current = document.activeElement as HTMLElement | null;

    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    const firstFocusable = focusable?.[0];
    if (firstFocusable) {
      requestAnimationFrame(() => firstFocusable.focus());
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      closeAndRestoreFocus();
    }

    function handleTabKey(event: KeyboardEvent) {
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (!focusable || focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (active === first || !dialogRef.current?.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keydown", handleTabKey);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keydown", handleTabKey);
    };
  }, [open, closeAndRestoreFocus]);

  if (!open) return null;

  const describedBy = subtitle ? subtitleId : undefined;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <button
        aria-hidden
        className="absolute inset-0 bg-black/40 transition-opacity duration-200 starting:opacity-0 motion-reduce:transition-none"
        onClick={closeAndRestoreFocus}
        tabIndex={-1}
        type="button"
      />
      <div
        aria-describedby={describedBy}
        aria-labelledby={titleId}
        aria-modal="true"
        className={cn(
          "tp-card relative flex max-h-[calc(100vh-160px)] flex-col overflow-hidden shadow-card transition-all duration-200 starting:scale-95 starting:opacity-0 motion-reduce:transition-none",
          SIZES[size],
        )}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.stopPropagation();
            closeAndRestoreFocus();
          }
        }}
        ref={dialogRef}
        role="dialog"
      >
        <header className="flex items-start justify-between gap-4 border-b border-tp-line px-5 py-4">
          <div>
            <h2 className="text-[22px] font-bold leading-tight text-tp-text" id={titleId}>
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-1 text-sm text-tp-muted" id={subtitleId}>
                {subtitle}
              </p>
            ) : null}
          </div>
          <button
            aria-label="Tutup"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-tp-muted transition-colors duration-200 hover:bg-tp-bg hover:text-tp-text motion-reduce:transition-none"
            onClick={closeAndRestoreFocus}
            type="button"
          >
            <IconX aria-hidden size={20} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footerActions.length > 0 ? (
          <footer className="flex items-center justify-end gap-2 border-t border-tp-line px-5 py-4">
            {footerActions.map((action, index) => {
              const variant =
                action.variant ?? (index === footerActions.length - 1 ? "primary" : "secondary");
              return (
                <button
                  className={cn(
                    "tp-btn",
                    variant === "primary" && "tp-btn--primary",
                    "disabled:pointer-events-none disabled:opacity-50",
                  )}
                  disabled={action.disabled}
                  key={action.label}
                  onClick={action.onClick}
                  type="button"
                >
                  {action.label}
                </button>
              );
            })}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
