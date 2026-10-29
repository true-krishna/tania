"use client";

import * as React from "react";
import { PageHeader } from "@/components/PageHeader";
import { useSessionRole } from "@/lib/auth/guard";
import { AuditViewer } from "./AuditViewer";

export default function AuditPage() {
  const role = useSessionRole();
  if (role !== "ADMIN") {
    return (
      <section className="flex flex-col gap-4">
        <PageHeader
          subtitle="Jejak audit hanya dapat diakses oleh peran Admin (FR-17)."
          title="Jejak Audit"
        />
      </section>
    );
  }
  return <AuditViewer />;
}
