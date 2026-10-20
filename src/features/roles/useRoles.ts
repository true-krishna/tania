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
import type { MenuAccessConfig } from "@/lib/auth/menuAccess";
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

/**
 * The caller's own menu grid, shaped for `visibleByConfig` so the sidebar and
 * the invariant tests read it exactly like the default matrix.
 */
export function useMyMenuConfig(): { config: MenuAccessConfig | null; roleName: string | null } {
  const { data } = useQuery(MyMenuConfigDocument);
  return React.useMemo(() => {
    const cells = data?.myMenuConfig;
    if (!cells?.length) return { config: null, roleName: null };
    const roleName = cells[0].roleName;
    return { roleName, config: { [roleName]: gridOf(cells, roleName) } };
  }, [data]);
}

export type RoleMenuAccessInput = {
  menuEntryId: string;
  visible: boolean;
  accessLevel: MenuAccessLevel;
};

export function useRoleMutations() {
  const [writeMenuAccess] = useMutation(SetRoleMenuAccessDocument);
  const [resetRoleMenuConfig] = useMutation(ResetRoleMenuConfigDocument);
  const [createRole] = useMutation(CreateRoleDocument);
  const [updateRoleLabel] = useMutation(UpdateRoleDocument);
  const [setStatus] = useMutation(SetRoleStatusDocument);
  const [removeRole] = useMutation(DeleteRoleDocument);

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
