"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { AccessRole } from "@/generated/graphql";
import { getSession } from "@/lib/auth/token-store";
import { authConfig } from "@/lib/auth/config";
import { canAccess, canManage, type Module } from "@/lib/auth/matrix";
import { LOGIN } from "@/lib/constants/routes";

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

export function AuthGuard({
  module,
  manage = false,
  children,
}: {
  module?: Module;
  manage?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const role = useSessionRole();

  // Guard access for `(app)/*` routes: without a session (normal mode)
  // redirect to /login; a role outside the module's matrix row hides the view
  // (UI layer). Final authorization is enforced server-side (FR-15/16).
  React.useEffect(() => {
    if (!authConfig.localOnly && role === null) {
      router.replace(LOGIN);
    }
  }, [role, router]);

  const allowed = (r: AccessRole | null | undefined) =>
    !module || (manage ? canManage(r, module) : canAccess(r, module));

  if (!authConfig.localOnly && role !== null && !allowed(role)) {
    return null;
  }

  if (authConfig.localOnly && !allowed(authConfig.defaultAccessRole as AccessRole | undefined)) {
    return null;
  }

  return <>{children}</>;
}