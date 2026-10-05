"use client";

import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { useMutation } from "@apollo/client";
import { LogoutDocument } from "@/generated/graphql";
import { Icon } from "@/components/Icon";
import { Sidebar, sectionForPath } from "@/components/Sidebar";
import { roleLabel } from "@/features/accounts/roles";
import { AuthGuard, useSessionRole } from "@/lib/auth/guard";
import { clearSession, getSession } from "@/lib/auth/token-store";
import {
  getSidebarWidthServerSnapshot,
  getSidebarWidthSnapshot,
  setSidebarWidth,
  subscribeSidebarWidth,
} from "@/lib/sidebar-width";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const role = useSessionRole();
  const pathname = usePathname();
  const [logout] = useMutation(LogoutDocument);

  // Persisted preference, read through an external store so the server render
  // uses the default and the client upgrades after hydration.
  const sidebarWidth = React.useSyncExternalStore(
    subscribeSidebarWidth,
    getSidebarWidthSnapshot,
    getSidebarWidthServerSnapshot,
  );

  async function handleLogout() {
    const refreshToken = getSession()?.refreshToken;
    try {
      // Best-effort: the backend revokes the refresh token. The local session
      // is cleared regardless so the user can sign back in.
      if (refreshToken) await logout({ variables: { refreshToken } });
    } finally {
      clearSession();
      router.replace("/login");
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen">
        <Sidebar
          role={role}
          pathname={pathname}
          width={sidebarWidth}
          onWidthChange={setSidebarWidth}
        />
        <div className="flex min-h-screen flex-col" style={{ marginLeft: sidebarWidth }}>
          <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b border-board-border bg-white/80 px-6 backdrop-blur">
            <p className="truncate text-sm font-semibold text-zinc-700">{sectionForPath(pathname)}</p>
            <div className="flex items-center gap-3">
              <span className="hidden rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 sm:inline">
                {role ? roleLabel[role] : "—"}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
              >
                <Icon name="signOut" className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </header>
          <main className="flex-1 px-6 py-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}