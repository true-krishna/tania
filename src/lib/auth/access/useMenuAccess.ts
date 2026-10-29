"use client";

import * as React from "react";
import {
  accessLevel,
  defaultEntryManageable,
  defaultEntryReadable,
  moduleManageable,
  moduleReadable,
  visibleByConfig,
} from "@/lib/auth/menuAccess";
import { canAccess, canManage, type Module } from "@/lib/auth/matrix";
import { useSessionRole } from "@/lib/auth/guard";
import { MenuAccessContext } from "./context";

export interface ModuleAccess {
  canRead: boolean;
  canManage: boolean;
  pending: boolean;
}

export interface EntryAccess extends ModuleAccess {
  visible: boolean;
}

export function useModuleAccess(module: Module): ModuleAccess {
  const menu = React.useContext(MenuAccessContext);
  const role = useSessionRole();

  return React.useMemo(() => {
    if (menu) {
      return {
        canRead: moduleReadable(menu.config, menu.roleName, module),
        canManage: moduleManageable(menu.config, menu.roleName, module),
        pending: false,
      };
    }
    return {
      canRead: canAccess(role, module),
      canManage: canManage(role, module),
      pending: role === null,
    };
  }, [menu, role, module]);
}

export function useMenuEntryAccess(entryId: string): EntryAccess {
  const menu = React.useContext(MenuAccessContext);
  const role = useSessionRole();

  return React.useMemo(() => {
    if (menu) {
      const level = accessLevel(menu.config, menu.roleName, entryId);
      return {
        visible: visibleByConfig(menu.config, menu.roleName, entryId),
        canRead: level === "READ" || level === "MANAGE",
        canManage: level === "MANAGE",
        pending: false,
      };
    }
    if (!role) return { visible: false, canRead: false, canManage: false, pending: true };
    const canRead = defaultEntryReadable(role, entryId);
    return {
      visible: canRead,
      canRead,
      canManage: defaultEntryManageable(role, entryId),
      pending: false,
    };
  }, [menu, role, entryId]);
}
