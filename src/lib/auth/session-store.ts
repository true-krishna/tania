"use client";

import * as React from "react";
import type { AccessRole } from "@/generated/graphql";
import { authConfig } from "./config";
import {
  getSessionSnapshot,
  getServerSessionSnapshot,
  subscribeToSession,
  type Session,
} from "./token-store";

/**
 * Reactive view of the cookie-backed session. `useState` snapshots go stale as
 * soon as the refresh link rotates the tokens or an admin changes the role, so
 * every consumer of the session identity reads the same external store instead.
 */
export function useSession(): Session | null {
  return React.useSyncExternalStore(
    subscribeToSession,
    getSessionSnapshot,
    getServerSessionSnapshot,
  );
}

export function useSessionRole(): AccessRole | null {
  const session = useSession();
  if (authConfig.localOnly) {
    return (authConfig.defaultAccessRole as AccessRole | undefined) ?? "TALENT";
  }
  return session?.accessRole ?? null;
}
