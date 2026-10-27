"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { authConfig } from "@/lib/auth/config";
import { canAccess, canManage, type Module } from "@/lib/auth/matrix";
import { useSessionRole } from "@/lib/auth/session-store";
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

  React.useEffect(() => {
    if (!authConfig.localOnly && role === null) {
      router.replace(LOGIN);
    }
  }, [role, router]);

  const allowed = !module || (manage ? canManage(role, module) : canAccess(role, module));

  if (!authConfig.localOnly && role !== null && !allowed) {
    return null;
  }

  if (authConfig.localOnly && !allowed) {
    return null;
  }

  return <>{children}</>;
}
