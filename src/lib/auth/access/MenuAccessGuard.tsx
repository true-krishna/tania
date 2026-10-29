"use client";

import * as React from "react";
import { AccessDenied } from "@/components/AccessDenied";
import type { Module } from "@/lib/auth/matrix";
import { useModuleAccess } from "./useMenuAccess";

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
  if (allowed) return children;
  if (fallback !== undefined) return fallback;
  return <AccessDenied canRead={access.canRead} manage={manage} />;
}
