"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PageHeader } from "@/components/monday";

const TABS = [
  { href: "/master-data/units", label: "Unit" },
  { href: "/master-data/chapters", label: "Chapter" },
  { href: "/master-data/job-roles", label: "Job Role" },
  { href: "/master-data/projects", label: "Project" },
] as const;

export default function MasterDataLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Master Data"
        subtitle="Reference data for the talent ecosystem, managed by Admin."
      />
      <nav aria-label="Master data section">
        <ul className="flex flex-wrap gap-1 rounded-lg border border-board-border bg-board p-1 shadow-sm">
          {TABS.map(({ href, label }) => {
            const active = pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`block rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    active ? "bg-brand-100 text-brand-700" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  }`}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {children}
    </div>
  );
}