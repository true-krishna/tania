"use client";

import * as React from "react";
import { MenuAccessGuard } from "@/lib/auth/access";

export default function MasterDataLayout({ children }: { children: React.ReactNode }) {
  return (
    <MenuAccessGuard module="masterData">
      <div className="flex flex-col gap-4">{children}</div>
    </MenuAccessGuard>
  );
}
