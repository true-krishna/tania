"use client";

import { cn } from "@/lib/cn";

type ToastVariant = "error" | "success";

const VARIANT_STYLES: Record<ToastVariant, string> = {
  error: "border-red-300 bg-red-50 text-red-900",
  success: "border-green-300 bg-green-50 text-green-900",
};

export function Toast({
  variant = "error",
  message,
  onDismiss,
}: {
  variant?: ToastVariant;
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start justify-between gap-3 rounded-md border px-3 py-2.5 shadow-lg",
        VARIANT_STYLES[variant],
      )}
    >
      <p className="text-sm">{message}</p>
      <button
        type="button"
        aria-label="Tutup notifikasi"
        onClick={onDismiss}
        className="text-xs font-semibold uppercase tracking-wide opacity-70 transition-opacity hover:opacity-100"
      >
        Tutup
      </button>
    </div>
  );
}

export function ToastStack({
  toasts,
  onDismiss,
  className = "",
}: {
  toasts: { id: string; variant?: ToastVariant; message: string }[];
  onDismiss: (id: string) => void;
  className?: string;
}) {
  return (
    <div
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed bottom-4 left-1/2 z-50 flex w-full max-w-md -translate-x-1/2 flex-col gap-2 px-4",
        className,
      )}
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          variant={toast.variant}
          message={toast.message}
          onDismiss={() => onDismiss(toast.id)}
        />
      ))}
    </div>
  );
}