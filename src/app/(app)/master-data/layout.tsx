import Link from "next/link";

const TABS = [
  { href: "/master-data/units", label: "Unit" },
  { href: "/master-data/chapters", label: "Chapter" },
  { href: "/master-data/job-roles", label: "Job Role" },
  { href: "/master-data/projects", label: "Project" },
] as const;

export default function MasterDataLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Master Data</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Reference data for the talent ecosystem, managed by Admin.
        </p>
      </div>
      <nav aria-label="Master data section">
        <ul className="flex gap-1 border-b border-zinc-200 text-sm">
          {TABS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="block rounded-t-md px-3 py-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {children}
    </div>
  );
}