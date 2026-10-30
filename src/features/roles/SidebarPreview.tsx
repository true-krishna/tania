"use client";

import * as React from "react";
import { SidebarNavPreview } from "./SidebarNavPreview";
import type { Role } from "./useRoles";
import type { MenuAccessConfig } from "@/lib/auth/menuAccess";
import { gridOf, type GridCell } from "./menuGrid";

export interface SidebarPreviewProps {
  role: Role | null;
  cells: readonly GridCell[];
}

export function SidebarPreview({ role, cells }: SidebarPreviewProps) {
  const config = React.useMemo<MenuAccessConfig | null>(() => {
    if (!role) return null;
    return { [role.name]: gridOf(cells, role.name) };
  }, [role, cells]);

  if (!role) {
    return (
      <p className="text-sm text-tp-muted">
        Pilih &ldquo;Pratinjau&rdquo; pada sebuah kolom role untuk melihat sidebar yang akan dilihat
        role tersebut.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-zinc-600">
        Sidebar untuk <span className="font-medium text-zinc-900">{role.label}</span> ({role.name})
        menurut konfigurasi di grid — sebelum disimpan.
      </p>
      <div
        aria-label={`Pratinjau sidebar role ${role.label}`}
        className="max-w-[268px] rounded-lg border border-tp-line bg-tp-surface p-2"
      >
        <SidebarNavPreview config={config} roleName={role.name} templateRole={role.templateRole} />
      </div>
    </div>
  );
}
