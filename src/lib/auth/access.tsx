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
import { AccessDenied } from "@/components/AccessDenied";

export interface ModuleAccess {
  canRead: boolean;
  canManage: boolean;
  pending: boolean;
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

export function MenuAccessGuard({
  module,
  manage = false,
  fallback,
  children,
}: {
  module: Module;
  manage?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const access = useModuleAccess(module);
  const allowed = manage ? access.canManage : access.canRead;

  if (access.pending) return null;
  if (allowed) return <>{children}</>;
  if (fallback !== undefined) return <>{fallback}</>;
  return <AccessDenied canRead={access.canRead} manage={manage} />;
}
