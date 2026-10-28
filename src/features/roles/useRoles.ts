"use client";

import * as React from "react";
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

export function useRoles(includeInactive = true): RefetchableQueryState<Role[] | undefined> {
  const result = useQuery(RolesDocument, { variables: { includeInactive } });
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

/**
 * The caller's own menu grid, shaped for `visibleByConfig` so the sidebar and
 * the invariant tests read it exactly like the default matrix.
 *
 * The query is `network-only` and re-runs whenever the session identity changes:
 * the cache is shared by every user of the browser, and a root field without
 * arguments would otherwise serve one role's grid to the next sign-in.
 */
export function useMyMenuConfig(): MyMenuConfig {
  const session = useSession();
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

  return React.useMemo(() => {
    if (authConfig.localOnly) {
      return { config: null, roleName: null, status: "ready", error: null, refetch };
    }
    const cells = result.data?.myMenuConfig;
    const roleName = cells?.[0]?.roleName ?? null;
    const config = cells?.length && roleName ? { [roleName]: gridOf(cells, roleName) } : null;
    const status: MenuConfigStatus =
      result.loading && !cells
        ? "loading"
        : result.error && !cells
          ? "error"
          : config
            ? "ready"
            : "empty";
    return {
      config,
      roleName,
      status,
      error: result.error?.message ?? null,
      refetch,
    };
  }, [result.data, result.error, result.loading, refetch]);
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
