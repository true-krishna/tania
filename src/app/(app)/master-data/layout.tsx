"use client";

import * as React from "react";
import { AuthGuard } from "@/lib/auth/guard";

export default function MasterDataLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard module="masterData">
      <div className="flex flex-col gap-4">{children}</div>
    </AuthGuard>
  );
}
