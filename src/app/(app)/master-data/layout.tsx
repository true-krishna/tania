"use client";

import * as React from "react";
import { AuthGuard } from "@/lib/auth/guard";

/**
 * Master-data section (FR-15/FR-20). The matrix grants Chapter and Operation a
 * read-only view and Admin the manage surface (2026-10-16 clarify 6); Talent has
 * no access at all, so the section is wrapped in the module guard — the sidebar
 * hides the entry, and this closes the direct-URL path. Each page renders its
 * edit surface only for the manage roles (`MasterDataSection`); auth is enforced
 * server-side (FR-16). The section's pages are navigated from the sidebar
 * submenu — no duplicate in-page tab bar. Page header lives in
 * MasterDataSection so its add action sits in the header.
 */
export default function MasterDataLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard module="masterData">
      <div className="flex flex-col gap-4">{children}</div>
    </AuthGuard>
  );
}
