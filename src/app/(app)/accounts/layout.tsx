"use client";

import * as React from "react";
import { MenuAccessGuard } from "@/lib/auth/access";

export default function AccountsLayout({ children }: { children: React.ReactNode }) {
  return <MenuAccessGuard module="accounts">{children}</MenuAccessGuard>;
}
