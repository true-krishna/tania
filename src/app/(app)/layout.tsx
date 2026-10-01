"use client";

import Link from "next/link";
import * as React from "react";
import { AuthGuard, useSessionRole } from "@/lib/auth/guard";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", roles: ["TALENT", "CHAPTER", "OPERATION", "ADMIN"] as const },
  { href: "/employees", label: "Employees", roles: ["OPERATION", "ADMIN"] as const },
  { href: "/assignments", label: "Assignments", roles: ["CHAPTER", "ADMIN"] as const },
  { href: "/idp", label: "IDP", roles: ["CHAPTER", "TALENT", "ADMIN"] as const },
  { href: "/accounts", label: "Accounts", roles: ["ADMIN"] as const },
  { href: "/master-data/units", label: "Master Data", roles: ["ADMIN"] as const },
] as const;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const role = useSessionRole();

  return (
    <AuthGuard>
      <div className="min-h-full">
        <nav className="border-b border-zinc-200 bg-white">
          <ul className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 py-2 text-sm">
            {NAV_ITEMS.map(({ href, label, roles }) =>
              role && (roles as readonly string[]).includes(role) ? (
                <li key={href}>
                  <Link
                    href={href}
                    className="rounded-md px-3 py-1.5 text-zinc-700 hover:bg-zinc-100"
                  >
                    {label}
                  </Link>
                </li>
              ) : null
            )}
          </ul>
        </nav>
        <main className="mx-auto w-full max-w-5xl px-4 py-6">{children}</main>
      </div>
    </AuthGuard>
  );
}