"use client";

import * as React from "react";
import type { MenuAccessConfig } from "@/lib/auth/menuAccess";
import { MenuAccessContext, type MenuAccessValue } from "./context";

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
