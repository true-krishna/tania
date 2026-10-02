"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { AccessRole } from "@/generated/graphql";
import { getSession } from "@/lib/auth/token-store";
import { authConfig } from "@/lib/auth/config";
import { atLeast, type RoleOrMore } from "@/lib/auth/roles";

export function useSessionRole(): AccessRole | null {
  // Session store is synchronous (cookie-backed, src/lib/auth/token-store) —
  // read once at mount, no effect, to avoid cascading renders (react-hooks lint).
  const [role] = React.useState<AccessRole | null>(() => {
    if (authConfig.localOnly) {
      return (authConfig.defaultAccessRole as AccessRole | undefined) ?? "TALENT";
    }
    const session = getSession();
    return session ? session.accessRole : null;
  });

  return role;
}

export function AuthGuard({ requiredRole, children }: { requiredRole?: RoleOrMore; children: React.ReactNode }) {
  const router = useRouter();
  const role = useSessionRole();

  // Guard access for `(app)/*` routes: without a session (normal mode)
  // redirect to /login; insufficient role hides the view (UI layer). Final
  // authorization is enforced server-side (FR-16).
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