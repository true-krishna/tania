"use client";

import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { useMutation } from "@apollo/client";
import { LogoutDocument } from "@/generated/graphql";
import { IconLogout } from "@tabler/icons-react";
import { Avatar } from "@/components/Avatar";
import { Sidebar, sectionForPath } from "@/components/Sidebar";
import { roleLabel } from "@/features/accounts/roles";
import { AuthGuard, useSessionRole } from "@/lib/auth/guard";
import { clearSession, getSession } from "@/lib/auth/token-store";
import {
  SIDEBAR_WIDTH_COLLAPSED,
  SIDEBAR_WIDTH_EXPANDED,
  getSidebarCollapsedServerSnapshot,
  getSidebarCollapsedSnapshot,
  setSidebarCollapsed,
  subscribeSidebarCollapsed,
} from "@/lib/sidebar-state";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const role = useSessionRole();
  const pathname = usePathname();
  const [logout] = useMutation(LogoutDocument);

  // Persisted preference, read through an external store so the server render
  // uses the default and the client upgrades after hydration.
  const collapsed = React.useSyncExternalStore(
    subscribeSidebarCollapsed,
    getSidebarCollapsedSnapshot,
    getSidebarCollapsedServerSnapshot,
  );
  const sidebarWidth = collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

  // Profile shown in the top-bar avatar; read once at mount, like `useSessionRole`.
  const [session] = React.useState(() => getSession());
  const displayName =
    session?.fullName?.trim() || session?.email?.split("@")[0] || (role ? roleLabel[role] : "Tania");

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
          collapsed={collapsed}
          onToggle={() => setSidebarCollapsed(!collapsed)}
        />
        <div
          className="flex min-h-screen flex-col transition-[margin] duration-200"
          style={{ marginLeft: sidebarWidth }}
        >
          <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b border-board-border bg-white/80 px-6 backdrop-blur">
            <p className="truncate text-sm font-semibold text-zinc-700">{sectionForPath(pathname)}</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5">
                <Avatar name={displayName} />
                <span className="hidden flex-col leading-tight sm:flex">
                  <span className="max-w-[14rem] truncate text-sm font-medium text-zinc-800">
                    {displayName}
                  </span>
                  <span className="text-[11px] text-zinc-500">{role ? roleLabel[role] : "—"}</span>
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
              >
                <IconLogout className="h-4 w-4" aria-hidden />
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