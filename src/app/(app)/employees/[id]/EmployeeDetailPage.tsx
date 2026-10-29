"use client";

import * as React from "react";
import { ToastProvider } from "@/components/Toast";
import { EmployeeDetailView } from "./EmployeeDetailView";

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  return (
    <ToastProvider>
      <EmployeeDetailView employeeId={id} />
    </ToastProvider>
  );
}
