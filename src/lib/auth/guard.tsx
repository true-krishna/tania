"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { AccessRole } from "@/generated/graphql";
import { getSession } from "@/lib/auth/token-store";
import { authConfig } from "@/lib/auth/config";
import { canAccess, type Module } from "@/lib/auth/matrix";

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

export function AuthGuard({ module, children }: { module?: Module; children: React.ReactNode }) {
  const router = useRouter();
  const role = useSessionRole();

  // Guard access for `(app)/*` routes: without a session (normal mode)
  // redirect to /login; a role outside the module's matrix row hides the view
  // (UI layer). Final authorization is enforced server-side (FR-15/16).
  React.useEffect(() => {
    if (!authConfig.localOnly && role === null) {
      router.replace("/login");
    }
  }, [role, router]);

  if (module && !authConfig.localOnly && role !== null && !canAccess(role, module)) {
    return null;
  }

  if (authConfig.localOnly) {
    const localRole = authConfig.defaultAccessRole as AccessRole | undefined;
    if (module && !canAccess(localRole, module)) return null;
  }

  return <>{children}</>;
}