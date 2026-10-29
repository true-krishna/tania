"use client";

import { cn } from "@/lib/cn";
import * as React from "react";
import { createPortal } from "react-dom";
import { ModalContext } from "./ModalContext";
import { useBodyScrollLock } from "./useBodyScrollLock";

export type ModalSize = "sm" | "md" | "lg";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  size?: ModalSize;
  triggerRef?: React.RefObject<HTMLElement | null>;
  className?: string;
  disableBackdropClick?: boolean;
  children: React.ReactNode;
}

const SIZES: Record<ModalSize, string> = {
  sm: "max-w-[420px]",
  md: "max-w-[560px]",
  lg: "max-w-[720px]",
};

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const EXIT_DURATION_MS = 200;

const subscribeToPortal = () => () => {};

function usePortalTarget() {
  return React.useSyncExternalStore(
    subscribeToPortal,
    () => document.body,
    () => null,
  );
}

export function Modal({
  open,
  onClose,
  size = "md",
  triggerRef,
  className,
  disableBackdropClick = false,
  children,
}: ModalProps) {
  const titleId = React.useId();
  const subtitleId = React.useId();
  const [mounted, setMounted] = React.useState(open);
  const [visible, setVisible] = React.useState(false);
  const [hasSubtitle, setHasSubtitle] = React.useState(false);
  const mountedRef = React.useRef(open);
  const wasOpenRef = React.useRef(open);
  const previousActiveElementRef = React.useRef<HTMLElement | null>(null);
  const dialogRef = React.useRef<HTMLDivElement | null>(null);
  const portalTarget = usePortalTarget();
  const shouldRender = open || mounted;

  useBodyScrollLock(shouldRender);

  React.useEffect(() => {
    if (open) {
      mountedRef.current = true;
      const frame = requestAnimationFrame(() => {
        setMounted(true);
        setVisible(true);
      });
      return () => cancelAnimationFrame(frame);
    }

    if (!mountedRef.current) return;

    let timer: number | undefined;
    const frame = requestAnimationFrame(() => {
      setVisible(false);
      timer = window.setTimeout(() => {
        mountedRef.current = false;
        setMounted(false);
      }, EXIT_DURATION_MS + 20);
    });

    return () => {
      cancelAnimationFrame(frame);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    previousActiveElementRef.current = document.activeElement as HTMLElement | null;
  }, [open]);

  React.useEffect(() => {
    if (!open || !portalTarget) return;

    const frame = requestAnimationFrame(() => {
      const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      firstFocusable?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [open, portalTarget]);

  React.useEffect(() => {
    if (wasOpenRef.current && !open) {
      const target = triggerRef?.current ?? previousActiveElementRef.current;
      target?.focus();
    }
    wasOpenRef.current = open;
  }, [open, triggerRef]);

  React.useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented) return;

      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }

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
        return;
      }

      if (active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!shouldRender || !portalTarget) return null;

  return createPortal(
    <div
      aria-hidden={!open}
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      inert={!open}
    >
      <button
        aria-hidden
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-200 motion-reduce:transition-none",
          visible ? "opacity-100" : "opacity-0",
        )}
        onClick={() => {
          if (!disableBackdropClick) onClose();
        }}
        tabIndex={-1}
        type="button"
      />
      <div
        aria-describedby={hasSubtitle ? subtitleId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className={cn(
          "tp-card relative flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden p-0! shadow-card transition-[opacity,scale] duration-200 ease-[var(--tp-ease)] motion-reduce:transition-none",
          SIZES[size],
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0",
          className,
        )}
        ref={dialogRef}
        role="dialog"
      >
        <ModalContext.Provider value={{ titleId, subtitleId, onClose, setHasSubtitle }}>
          {children}
        </ModalContext.Provider>
      </div>
    </div>,
    portalTarget,
  );
}
