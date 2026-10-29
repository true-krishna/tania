"use client";

import * as React from "react";
import type { MenuAccessConfig } from "@/lib/auth/menuAccess";

export interface MenuAccessValue {
  config: MenuAccessConfig;
  roleName: string;
}

export const MenuAccessContext = React.createContext<MenuAccessValue | null>(null);
