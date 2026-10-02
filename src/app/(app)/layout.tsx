"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-20 flex w-60 flex-col border-r border-board-border bg-sidebar">
          <div className="flex items-center gap-2 px-5 py-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-sm font-bold text-white">
              T
            </span>
            <span className="text-base font-semibold tracking-tight text-zinc-900">Tania</span>
          </div>
          <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-3 py-2">
            <ul className="flex flex-col gap-0.5 text-sm">
              {NAV_ITEMS.map(({ href, label, roles }) => {
                const active =
                  href === "/dashboard"
                    ? pathname === href
                    : pathname.startsWith(href);
                if (role && !(roles as readonly string[]).includes(role)) return null;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={`block rounded-md px-3 py-2 font-medium transition-colors ${
                        active
                          ? "bg-brand-50 text-brand-700"
                          : "text-sidebar-muted hover:bg-zinc-100 hover:text-sidebar-fg"
                      }`}
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="border-t border-board-border px-5 py-3 text-xs text-zinc-500">
            Logged in as {role?.toLowerCase() ?? "—"}
          </div>
        </aside>
        <main className="ml-60 flex-1 px-6 py-6">{children}</main>
      </div>
    </AuthGuard>
  );
}