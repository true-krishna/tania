"use client";

import * as React from "react";
import { useSessionRole } from "@/lib/auth/guard";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { getSession } from "@/lib/auth/token-store";

export default function DashboardPage() {
  const role = useSessionRole();
  const session = getSession();

  return (
    <section className="flex flex-col gap-4">
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome${session ? `, ${session.accessRole.toLowerCase()}` : ""}. Role-specific dashboard widgets are scheduled for W7.`}
      />
      <Card>
        <p className="text-sm">
          <span className="font-medium">Current role:</span>{" "}
          <code className="rounded bg-brand-100 px-1.5 py-0.5 font-semibold text-brand-700">
            {role ?? "—"}
          </code>
        </p>
      </Card>
    </section>
  );
}