"use client";

import * as React from "react";
import { ToastProvider } from "@/components/Toast";
import { IdpDetailView } from "./IdpDetailView";

export default function IdpDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  return (
    <ToastProvider>
      <IdpDetailView id={id} />
    </ToastProvider>
  );
}
