"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMenuEntryAccess } from "@/lib/auth/access";
import { PageHeader } from "@/components/PageHeader";
import { EVALUATIONS, EVALUATION_PERIODS, EVALUATION_TEMPLATES } from "@/lib/constants/routes";

export function EvaluationsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const roster = useMenuEntryAccess("evaluations");
  const periods = useMenuEntryAccess("evaluations/periods");
  const templates = useMenuEntryAccess("evaluations/templates");

  const tabs = [
    { href: EVALUATIONS, label: "Roster", visible: roster.visible },
    { href: EVALUATION_PERIODS, label: "Periode", visible: periods.visible },
    { href: EVALUATION_TEMPLATES, label: "Template", visible: templates.visible },
  ].filter((tab) => tab.visible);

  const showTabs = tabs.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        subtitle="Evaluasi performa talent per periode (Admin: template & periode; Chapter: penilaian; Operation: hanya-baca; Talent: evaluasi miliknya)."
        title="Evaluasi"
      />
      {showTabs ? (
        <nav aria-label="Evaluations section">
          <ul className="flex flex-wrap gap-1 rounded-lg border border-board-border bg-board p-1 shadow-sm">
            {tabs.map(({ href, label }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <li key={href}>
                  <Link
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-tp-brand-navy text-tp-on-nav"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                    }`}
                    href={href}
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
