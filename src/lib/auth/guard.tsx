"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { authConfig } from "@/lib/auth/config";
import { canAccess, canManage, type Module } from "@/lib/auth/matrix";
import { isSessionExpired } from "@/lib/auth/session-codec";
import { useSession, useSessionRole } from "@/lib/auth/session-store";
import { getSession } from "@/lib/auth/token-store";
import { LOGIN } from "@/lib/constants/routes";

export { useSession, useSessionRole } from "@/lib/auth/session-store";

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
  const session = useSession();

  React.useEffect(() => {
    if (authConfig.localOnly) return;
    if (session) return;
    const stored = getSession();
    if (stored && !isSessionExpired(stored)) return;
    router.replace(LOGIN);
  }, [session, router]);

  const allowed = !module || (manage ? canManage(role, module) : canAccess(role, module));

  if (!authConfig.localOnly && role !== null && !allowed) {
    return null;
  }

  if (authConfig.localOnly && !allowed) {
    return null;
  }

  return children;
}
