"use client";

import * as React from "react";
import { useSessionRole } from "@/lib/auth/guard";
import { getSession } from "@/lib/auth/token-store";

/**
 * Halaman landing terautentikasi. Widget dashboard per peran (US8/FR-29)
 * dibangun pada W7 (plan.md roadmap); halaman ini hanya menegaskan sesi
 * sebelum modul fitur tersedia.
 */
export default function DashboardPage() {
  const role = useSessionRole();
  const session = getSession();

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
      <p className="text-sm text-zinc-600">
        Selamat datang{session ? `, ${session.accessRole.toLowerCase()}` : ""}. Widget
        dashboard per peran menyusul (W7).
      </p>
      <div className="rounded-md border border-zinc-200 bg-white p-4 text-sm">
        <p>
          <span className="font-medium">Peran saat ini:</span>{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5">{role ?? "—"}</code>
        </p>
      </div>
    </section>
  );
}