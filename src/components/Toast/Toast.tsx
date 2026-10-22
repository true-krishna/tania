"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

type ToastVariant = "error" | "success";

type ToastItem = {
  id: number;
  variant: ToastVariant;
  message: string;
};

type ToastContextValue = {
  pushToast: (variant: ToastVariant, message: string) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const nextId = React.useRef(1);

  const dismiss = React.useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = React.useCallback(
    (variant: ToastVariant, message: string) => {
      const id = nextId.current++;
      setToasts((prev) => [...prev, { id, variant, message }]);
      window.setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  const value = React.useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastStack onDismiss={dismiss} toasts={toasts} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

export function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 left-1/2 z-50 flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4"
    >
      {toasts.map((t) => (
        <div
          className={cn(
            "pointer-events-auto flex items-start gap-2 rounded-tp-md border border-tp-line px-3 py-2 text-sm shadow-card",
            t.variant === "error"
              ? "bg-tp-tint-peach text-tp-ink-peach"
              : "bg-tp-tint-mint text-tp-ink-mint",
          )}
          key={t.id}
          role="alert"
        >
          <span className="flex-1">{t.message}</span>
          <button
            aria-label="Tutup notifikasi"
            className="text-xs opacity-70 transition-opacity hover:opacity-100"
            onClick={() => onDismiss(t.id)}
            type="button"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}