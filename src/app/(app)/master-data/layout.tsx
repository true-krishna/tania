"use client";

import * as React from "react";
import { useSessionRole } from "@/lib/auth/guard";

/**
 * Admin-only section (FR-15/FR-20); auth is enforced server-side (FR-16) and
 * this hides the view at the UI layer for non-Admin roles. The section's pages
 * are navigated from the sidebar submenu — no duplicate in-page tab bar.
 * Page header lives in MasterDataSection so its add action sits in the header.
 */
export default function MasterDataLayout({ children }: { children: React.ReactNode }) {
  const role = useSessionRole();
  if (role !== "ADMIN") return null;

  return <div className="flex flex-col gap-4">{children}</div>;
}
