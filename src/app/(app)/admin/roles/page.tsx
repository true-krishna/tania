"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { RolesAdminSection } from "@/features/roles/RolesAdminSection";
import { useSessionRole } from "@/lib/auth/guard";
import { DASHBOARD } from "@/lib/constants/routes";

/**
 * Menu & access configuration page (W3 / TAN-264, FR-03 amandemen) — Admin only.
 *
 * The server enforces Admin on every query and mutation of this page
 * (`roleMenuConfig`, `setRoleMenuAccess`, role CRUD); this guard keeps a
 * non-Admin from landing on a page whose data they cannot read, and sends them
 * back to the dashboard. It is a courtesy, not the enforcement point (FR-16).
 */
export default function RolesAdminPage() {
  const role = useSessionRole();
  const router = useRouter();

  React.useEffect(() => {
    if (role && role !== "ADMIN") router.replace(DASHBOARD);
  }, [role, router]);

  if (role !== "ADMIN") {
    return (
      <section className="flex flex-col gap-4">
        <PageHeader
          title="Menu & Akses per Role"
          subtitle="Halaman ini hanya dapat diakses oleh peran Admin."
        />
      </section>
    );
  }

  return <RolesAdminSection />;
}
