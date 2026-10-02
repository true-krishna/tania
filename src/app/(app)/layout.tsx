"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { useMutation } from "@apollo/client";
import { LogoutDocument } from "@/generated/graphql";
import { AuthGuard, useSessionRole } from "@/lib/auth/guard";
import { clearSession, getSession } from "@/lib/auth/token-store";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", roles: ["TALENT", "CHAPTER", "OPERATION", "ADMIN"] as const },
  { href: "/employees", label: "Employees", roles: ["OPERATION", "ADMIN"] as const },
  { href: "/assignments", label: "Assignments", roles: ["CHAPTER", "ADMIN"] as const },
  { href: "/idp", label: "IDP", roles: ["CHAPTER", "TALENT", "ADMIN"] as const },
  { href: "/accounts", label: "Accounts", roles: ["ADMIN"] as const },
  { href: "/master-data/units", label: "Master Data", roles: ["ADMIN"] as const },
] as const;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const role = useSessionRole();
  const pathname = usePathname();
  const [logout] = useMutation(LogoutDocument);

  async function handleLogout() {
    const refreshToken = getSession()?.refreshToken;
    try {
      // Best-effort: the backend revokes the refresh token. The local session
      // is cleared regardless so the user can sign back in.
      if (refreshToken) await logout({ variables: { refreshToken } });
    } finally {
      clearSession();
      router.replace("/login");
    }
  }

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
            <div className="mb-2">Logged in as {role?.toLowerCase() ?? "—"}</div>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full rounded-md px-3 py-1.5 text-left text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            >
              Sign out
            </button>
          </div>
        </aside>
        <main className="ml-60 flex-1 px-6 py-6">{children}</main>
      </div>
    </AuthGuard>
  );
}