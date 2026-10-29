"use client";

import * as React from "react";
import { ToastContext, type ToastItem, type ToastVariant } from "./ToastContext";
import { ToastStack } from "./ToastStack";

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
