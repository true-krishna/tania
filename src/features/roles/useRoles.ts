"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client";
import {
  CreateRoleDocument,
  DeleteRoleDocument,
  MyMenuConfigDocument,
  ResetRoleMenuConfigDocument,
  RoleMenuConfigDocument,
  RolesDocument,
  SetRoleMenuAccessDocument,
  SetRoleStatusDocument,
  UpdateRoleDocument,
  type RolesQuery,
} from "@/generated/graphql";
import type { MenuAccessLevel, RoleStatus, AccessRole } from "@/generated/graphql/types";
import { toQueryState, type QueryState } from "@/lib/apollo/toQueryState";
import { authConfig } from "@/lib/auth/config";
import type { MenuAccessConfig, MenuConfigStatus } from "@/lib/auth/menuAccess";
import { defaultMenuAccessFor } from "@/lib/auth/menuAccess";
import { useSession } from "@/lib/auth/session-store";
import { gridOf, type GridCell, type RoleGrid } from "./menuGrid";

export type Role = RolesQuery["roles"][number];

type MenuCells = readonly GridCell[];

/**
 * Role & menu-configuration data hooks (W3 / TAN-264).
 *
 * `roles` and `roleMenuConfig` are W1's read API; the configuration writes are
 * W3's (`setRoleMenuAccess`, `resetRoleMenuConfig`). `myMenuConfig` is the one
 * query every role may call — it returns the caller's own role, which is what
 * makes the sidebar follow the active configuration without a re-deploy.
 */

/** Query state plus the refetch the configuration page calls after a write. */
export type RefetchableQueryState<T> = QueryState<T> & { refetch: () => Promise<unknown> };

export function useRoles(
  includeInactive = true,
  skip = false,
): RefetchableQueryState<Role[] | undefined> {
  const result = useQuery(RolesDocument, { variables: { includeInactive }, skip });
  return {
    ...toQueryState({ ...result, data: result.data?.roles }),
    refetch: () => result.refetch(),
  };
}

/** The whole menu × role grid, or one role's slice. Admin only. */
export function useRoleMenuConfig(roleId?: string): RefetchableQueryState<MenuCells | undefined> {
  const result = useQuery(RoleMenuConfigDocument, { variables: roleId ? { roleId } : {} });
  return {
    ...toQueryState({ ...result, data: result.data?.roleMenuConfig }),
    refetch: () => result.refetch(),
  };
}

export interface MyMenuConfig {
  config: MenuAccessConfig | null;
  roleName: string | null;
  status: MenuConfigStatus;
  error: string | null;
  refetch: () => Promise<unknown>;
}

/** Ignore revalidation triggers this close together (focus + route land as one). */
const REVALIDATE_COALESCE_MS = 1000;

/**
 * The caller's own menu grid, shaped for `visibleByConfig` so the sidebar and
 * the invariant tests read it exactly like the default matrix.
 *
 * The query is `network-only` and re-runs whenever the session identity changes:
 * the cache is shared by every user of the browser, and a root field without
 * arguments would otherwise serve one role's grid to the next sign-in.
 *
 * It also revalidates when the window regains focus or the route changes, so a
 * config edit made by an Admin reaches an already-open session without a logout
 * or reload. Revalidation is coalesced: an in-flight request absorbs further
 * triggers, and triggers within `REVALIDATE_COALESCE_MS` of the last one are
 * ignored. Route changes are the primary path, so a session that only keeps the
 * tab open still converges on the next navigation; there is no TTL poll.
 *
 * When the query fails after having answered, the last grid is kept. When it
 * fails before ever answering, the role's default grid is returned with status
 * `error`, which is the same matrix the server falls back to — the UI must not
 * turn a transient network failure into "no access".
 */
export function useMyMenuConfig(): MyMenuConfig {
  const session = useSession();
  const pathname = usePathname();
  const result = useQuery(MyMenuConfigDocument, {
    fetchPolicy: "network-only",
    skip: authConfig.localOnly,
    notifyOnNetworkStatusChange: true,
  });

  const sessionKey = [
    session?.accessRole ?? "",
    session?.roleName ?? "",
    session?.refreshToken ?? "",
  ].join(":");

  const lastSessionKey = React.useRef<string | null>(null);
  const { refetch } = result;
  React.useEffect(() => {
    if (lastSessionKey.current === null) {
      lastSessionKey.current = sessionKey;
      return;
    }
    if (lastSessionKey.current === sessionKey) return;
    lastSessionKey.current = sessionKey;
    if (!authConfig.localOnly) void refetch?.();
  }, [sessionKey, refetch]);

  const refetchRef = React.useRef(refetch);
  React.useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);

  const inFlight = React.useRef(false);
  const lastRevalidatedAt = React.useRef(0);
  const revalidate = React.useCallback(() => {
    if (authConfig.localOnly || inFlight.current) return;
    const now = Date.now();
    if (now - lastRevalidatedAt.current < REVALIDATE_COALESCE_MS) return;
    lastRevalidatedAt.current = now;
    inFlight.current = true;
    void Promise.resolve(refetchRef.current?.()).finally(() => {
      inFlight.current = false;
    });
  }, []);

  React.useEffect(() => {
    if (authConfig.localOnly) return;
    const onFocus = () => revalidate();
    const onVisibility = () => {
      if (document.visibilityState === "visible") onFocus();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [revalidate]);

  const lastPathname = React.useRef(pathname);
  React.useEffect(() => {
    if (lastPathname.current === pathname) return;
    lastPathname.current = pathname;
    revalidate();
  }, [pathname, revalidate]);

  const sessionRoleName = session?.roleName ?? session?.accessRole ?? null;
  const sessionTemplateRole = session?.accessRole ?? null;

  return React.useMemo(() => {
    if (authConfig.localOnly) {
      return { config: null, roleName: null, status: "ready", error: null, refetch };
    }
    const cells = result.data?.myMenuConfig;
    const serverRoleName = cells?.[0]?.roleName ?? null;
    const roleName = serverRoleName ?? sessionRoleName;
    let config =
      cells?.length && serverRoleName ? { [serverRoleName]: gridOf(cells, serverRoleName) } : null;
    const status: MenuConfigStatus = menuConfigStatus(
      result.loading,
      !!result.error,
      !!cells,
      !!config,
    );
    if (status === "error") {
      config = defaultMenuAccessFor(sessionRoleName, sessionTemplateRole) ?? config;
    }
    return {
      config,
      roleName,
      status,
      error: result.error?.message ?? null,
      refetch,
    };
  }, [result.data, result.error, result.loading, refetch, sessionRoleName, sessionTemplateRole]);
}

export type RoleMenuAccessInput = {
  menuEntryId: string;
  visible: boolean;
  accessLevel: MenuAccessLevel;
};

export function useRoleMutations() {
  const refetchMenu = [{ query: MyMenuConfigDocument }];
  const [writeMenuAccess] = useMutation(SetRoleMenuAccessDocument, {
    refetchQueries: refetchMenu,
  });
  const [resetRoleMenuConfig] = useMutation(ResetRoleMenuConfigDocument, {
    refetchQueries: refetchMenu,
  });
  const [createRole] = useMutation(CreateRoleDocument, { refetchQueries: refetchMenu });
  const [updateRoleLabel] = useMutation(UpdateRoleDocument, { refetchQueries: refetchMenu });
  const [setStatus] = useMutation(SetRoleStatusDocument, { refetchQueries: refetchMenu });
  const [removeRole] = useMutation(DeleteRoleDocument, { refetchQueries: refetchMenu });

  return {
    saveMenuAccess: (roleId: string, entries: RoleMenuAccessInput[]) =>
      writeMenuAccess({ variables: { roleId, entries } }),
    resetMenuConfig: (roleId: string) => resetRoleMenuConfig({ variables: { roleId } }),
    createRole: (name: string, label: string, templateRole: AccessRole) =>
      createRole({ variables: { input: { name, label, templateRole } } }),
    renameRole: (id: string, label: string) => updateRoleLabel({ variables: { id, label } }),
    setRoleStatus: (id: string, status: RoleStatus) => setStatus({ variables: { id, status } }),
    deleteRole: (id: string) => removeRole({ variables: { id } }),
  };
}

export type { RoleGrid };

function menuConfigStatus(
  loading: boolean,
  hasError: boolean,
  hasCells: boolean,
  hasConfig: boolean,
): MenuConfigStatus {
  if (loading && !hasCells) return "loading";
  if (hasError && !hasCells) return "error";
  if (hasConfig) return "ready";
  return "empty";
}
