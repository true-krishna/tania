"use client";

import { ToastProvider } from "@/components/Toast";
import { MyIdpViewContent } from "./MyIdpViewContent";

export function MyIdpView() {
  return (
    <ToastProvider>
      <MyIdpViewContent />
    </ToastProvider>
  );
}
