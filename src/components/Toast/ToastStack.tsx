"use client";

import { cn } from "@/lib/cn";
import type { ToastItem } from "./ToastContext";

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
