"use client";

import * as React from "react";

/**
 * Master-data section (FR-15/FR-20). The matrix grants `lihat` on reference
 * data to every role and `kelola` to Admin, so the section opens for all and
 * each page renders its edit surface only for the manage roles
 * (`MasterDataSection`); auth is enforced server-side (FR-16). The section's
 * pages are navigated from the sidebar submenu — no duplicate in-page tab bar.
 * Page header lives in MasterDataSection so its add action sits in the header.
 */
export default function MasterDataLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-4">{children}</div>;
}
