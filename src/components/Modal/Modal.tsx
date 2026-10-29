"use client";

import { cn } from "@/lib/cn";
import { IconX } from "@tabler/icons-react";
import * as React from "react";
import { createPortal } from "react-dom";
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

export interface ModalTitleProps extends Omit<React.ComponentPropsWithoutRef<"header">, "title"> {
  subtitle?: React.ReactNode;
}

export type ModalContentProps = React.ComponentPropsWithoutRef<"div">;

export type ModalActionsProps = React.ComponentPropsWithoutRef<"footer">;

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

interface ModalContextValue {
  titleId: string;
  subtitleId: string;
  onClose: () => void;
  setHasSubtitle: (value: boolean) => void;
}

const ModalContext = React.createContext<ModalContextValue | null>(null);

function useModalContext() {
  const context = React.useContext(ModalContext);
  if (!context) {
    throw new Error("Modal subcomponents must be rendered inside <Modal>.");
  }
  return context;
}

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

export function ModalTitle({ subtitle, className, children, ...rest }: ModalTitleProps) {
  const { titleId, subtitleId, onClose, setHasSubtitle } = useModalContext();

  React.useEffect(() => {
    setHasSubtitle(Boolean(subtitle));
    return () => setHasSubtitle(false);
  }, [setHasSubtitle, subtitle]);

  return (
    <header
      className={cn(
        "flex shrink-0 items-start justify-between gap-4 border-b border-tp-line px-5 py-4",
        className,
      )}
      {...rest}
    >
      <div>
        <h2 className="text-[22px] font-bold leading-tight text-tp-text" id={titleId}>
          {children}
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
        onClick={onClose}
        type="button"
      >
        <IconX aria-hidden size={20} />
      </button>
    </header>
  );
}

export function ModalContent({ className, ...rest }: ModalContentProps) {
  return <div className={cn("min-h-0 flex-1 overflow-y-auto px-5 py-4", className)} {...rest} />;
}

export function ModalActions({ className, ...rest }: ModalActionsProps) {
  return (
    <footer
      className={cn(
        "flex shrink-0 items-center justify-end gap-2 border-t border-tp-line px-5 py-4",
        className,
      )}
      {...rest}
    />
  );
}
