"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { RolesAdminSection } from "@/features/roles/RolesAdminSection";
import { useSessionRole } from "@/lib/auth/guard";
import { DASHBOARD } from "@/lib/constants/routes";

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
          subtitle="Halaman ini hanya dapat diakses oleh peran Admin."
          title="Menu & Akses per Role"
        />
      </section>
    );
  }

  return <RolesAdminSection />;
}
