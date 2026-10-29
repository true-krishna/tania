"use client";

import * as React from "react";

export type ToastVariant = "error" | "success";

export type ToastItem = {
  id: number;
  variant: ToastVariant;
  message: string;
};

export type ToastContextValue = {
  pushToast: (variant: ToastVariant, message: string) => void;
};

export const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}
