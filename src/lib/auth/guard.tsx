"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { AccessRole } from "@/generated/graphql";
import { getSession } from "@/lib/auth/token-store";
import { authConfig } from "@/lib/auth/config";
import { atLeast, type RoleOrMore } from "@/lib/auth/roles";

/**
 * Peran session saat ini. Mode local-only mengembalikan `defaultAccessRole`
 * (dev, plan.md R3); mode normal mengambil sesi in-memory. Sesion dari cookie
 * server dilengkapi modul auth penuh (W1+).
 */
export function useSessionRole(): AccessRole | null {
  // Toko sesi bersifat sinkron (in-memory, plan.md §5.2) — baca sekali saat
  // mount tanpa effect untuk menghindari cascading render (react-hooks lint).
  const [role] = React.useState<AccessRole | null>(() => {
    if (authConfig.localOnly) {
      return (authConfig.defaultAccessRole as AccessRole | undefined) ?? "TALENT";
    }
    const session = getSession();
    return session ? session.accessRole : null;
  });

  return role;
}

/**
 * Guard akses untuk route `(app)/*`. Tanpa sesi (mode normal) redirect ke
 * `/login`; peran kurang dari `requiredRole` dianggap tak berhak (303/403 UI).
 * Otorisasi final tetap di server (FR-16); ini lapisan UI.
 */
export function AuthGuard({ requiredRole, children }: { requiredRole?: RoleOrMore; children: React.ReactNode }) {
  const router = useRouter();
  const role = useSessionRole();

  React.useEffect(() => {
    if (!authConfig.localOnly && role === null) {
      router.replace("/login");
    }
  }, [role, router]);

  if (requiredRole && !authConfig.localOnly && role !== null && !atLeast(role, requiredRole)) {
    return null;
  }

  if (authConfig.localOnly) {
    const localRole = authConfig.defaultAccessRole as AccessRole | undefined;
    if (requiredRole && !atLeast(localRole, requiredRole)) return null;
  }

  return <>{children}</>;
}