"use client";

import * as React from "react";
import {
  accessLevel,
  defaultEntryManageable,
  defaultEntryReadable,
  moduleManageable,
  moduleReadable,
  visibleByConfig,
  type MenuAccessConfig,
} from "@/lib/auth/menuAccess";
import { canAccess, canManage, type Module } from "@/lib/auth/matrix";
import { useSessionRole } from "@/lib/auth/guard";

export interface ModuleAccess {
  canRead: boolean;
  canManage: boolean;
}

export interface EntryAccess extends ModuleAccess {
  visible: boolean;
}

interface MenuAccessValue {
  config: MenuAccessConfig;
  roleName: string;
}

const MenuAccessContext = React.createContext<MenuAccessValue | null>(null);

export function MenuAccessProvider({
  config,
  roleName,
  children,
}: {
  config: MenuAccessConfig | null;
  roleName: string | null;
  children: React.ReactNode;
}) {
  const value = React.useMemo<MenuAccessValue | null>(
    () => (config && roleName ? { config, roleName } : null),
    [config, roleName],
  );
  return <MenuAccessContext.Provider value={value}>{children}</MenuAccessContext.Provider>;
}

export function useModuleAccess(module: Module): ModuleAccess {
  const menu = React.useContext(MenuAccessContext);
  const role = useSessionRole();

  return React.useMemo(() => {
    if (menu) {
      return {
        canRead: moduleReadable(menu.config, menu.roleName, module),
        canManage: moduleManageable(menu.config, menu.roleName, module),
      };
    }
    return { canRead: canAccess(role, module), canManage: canManage(role, module) };
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
      };
    }
    if (!role) return { visible: false, canRead: false, canManage: false };
    const canRead = defaultEntryReadable(role, entryId);
    return {
      visible: canRead,
      canRead,
      canManage: defaultEntryManageable(role, entryId),
    };
  }, [menu, role, entryId]);
}

export function MenuAccessGuard({
  module,
  manage = false,
  children,
}: {
  module: Module;
  manage?: boolean;
  children: React.ReactNode;
}) {
  const access = useModuleAccess(module);
  const allowed = manage ? access.canManage : access.canRead;
  return allowed ? <>{children}</> : null;
}
