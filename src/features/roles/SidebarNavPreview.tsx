"use client";

import * as React from "react";
import { visibleNavEntries, type NavSubmenu } from "@/components/Sidebar/nav";
import type { MenuAccessConfig } from "@/lib/auth/menuAccess";

export function SidebarNavPreview({
  config,
  roleName,
}: {
  config: MenuAccessConfig | null;
  roleName: string;
}) {
  const entries = React.useMemo(() => visibleNavEntries(config, roleName), [config, roleName]);

  if (entries.length === 0) {
    return (
      <p className="px-2 py-1 text-sm text-tp-muted">Tidak ada menu yang tampil untuk role ini.</p>
    );
  }

  return (
    <nav aria-label={`Pratinjau menu ${roleName}`}>
      <ul className="flex flex-col gap-1">
        {entries.map((entry) =>
          entry.kind === "link" ? (
            <li key={entry.href}>
              <span className="tp-nav-item">
                <entry.icon aria-hidden className="h-[18px] w-[18px] shrink-0" />
                <span className="min-w-0 truncate">{entry.label}</span>
              </span>
            </li>
          ) : (
            <li key={entry.id}>
              <span className="tp-nav-item">
                <entry.icon aria-hidden className="h-[18px] w-[18px] shrink-0" />
                <span className="min-w-0 flex-1 truncate">{entry.label}</span>
              </span>
              <ul className="ml-[22px] mt-0.5 flex flex-col gap-1 pl-2">
                {(entry as NavSubmenu).children.map((child) => (
                  <li key={child.href}>
                    <span className="tp-nav-item">
                      <span className="min-w-0 truncate">{child.label}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}
