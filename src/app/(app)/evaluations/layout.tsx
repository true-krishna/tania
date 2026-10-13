"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSessionRole } from "@/lib/auth/guard";
import { PageHeader } from "@/components/PageHeader";

/**
 * Evaluations section — role-scoped tabs (US7).
 * - Chapter & Admin land on the roster; Admin additionally gets Period &
 *   Template configuration tabs. Talent has no sub-tabs (single read-only view).
 * Final authorization is enforced server-side (FR-16/FR-27).
 */
export default function EvaluationsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const role = useSessionRole();

  const tabs = [
    { href: "/evaluations", label: "Roster", roles: ["CHAPTER", "ADMIN"] },
    { href: "/evaluations/periods", label: "Periode", roles: ["ADMIN"] },
    { href: "/evaluations/templates", label: "Template", roles: ["ADMIN"] },
  ].filter((t) => !role || (t.roles as readonly string[]).includes(role));

  const showTabs = tabs.length > 0 && role !== "TALENT";

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Evaluasi"
        subtitle="Evaluasi performa talent per periode (Admin: template & periode; Chapter: penilaian; Talent: hanya-baca)."
      />
      {showTabs ? (
        <nav aria-label="Evaluations section">
          <ul className="flex flex-wrap gap-1 rounded-lg border border-board-border bg-board p-1 shadow-sm">
            {tabs.map(({ href, label }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      active ? "bg-tp-brand-navy text-tp-on-nav" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
      {children}
    </div>
  );
}