"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { authConfig } from "@/lib/auth/config";
import { isSessionExpired } from "@/lib/auth/session-codec";
import { useSession } from "@/lib/auth/session-store";
import { getSession } from "@/lib/auth/token-store";
import { LOGIN } from "@/lib/constants/routes";

export { useSession, useSessionRole } from "@/lib/auth/session-store";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const session = useSession();

  React.useEffect(() => {
    if (authConfig.localOnly) return;
    if (session) return;
    const stored = getSession();
    if (stored && !isSessionExpired(stored)) return;
    router.replace(LOGIN);
  }, [session, router]);

  return children;
}
