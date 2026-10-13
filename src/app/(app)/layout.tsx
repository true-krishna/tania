"use client";

import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { useMutation } from "@apollo/client";
import { LogoutDocument } from "@/generated/graphql";
import { IconChartBar, IconClockHour3 } from "@tabler/icons-react";
import { Sidebar, sectionForPath } from "@/components/Sidebar";
import { UserMenu } from "@/components/UserMenu";
import { roleLabel } from "@/features/accounts/roles";
import { AuthGuard, useSessionRole } from "@/lib/auth/guard";
import { clearSession, getSession } from "@/lib/auth/token-store";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const role = useSessionRole();
  const pathname = usePathname();
  const [logout] = useMutation(LogoutDocument);

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
      {/* Shell per constitution-design v4.0.0 §VIII: 268px sticky sidebar,
       * topbar 16px 28px, main 24px 28px with a 1160px content container;
       * ≤860px the sidebar strip is static and paddings tighten. */}
      <div className="flex min-h-screen flex-col min-[861px]:flex-row">
        <Sidebar role={role} pathname={pathname} />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-tp-line bg-tp-surface px-4 py-3 min-[861px]:px-7 min-[861px]:py-4">
            <p className="truncate text-sm font-semibold text-zinc-700">{sectionForPath(pathname)}</p>
            <div className="flex items-center gap-3">
              <UserMenu
                name={displayName}
                email={session?.email}
                roleLabel={role ? roleLabel[role] : null}
                items={[
                  { href: "/activities", label: "Aktivitas saya", icon: IconClockHour3 },
                  { href: "/workload", label: "Workload", icon: IconChartBar },
                ]}
                onLogout={handleLogout}
              />
            </div>
          </header>
          <main className="flex-1 px-4 py-4 min-[861px]:px-7 min-[861px]:py-6">
            <div className="mx-auto w-full max-w-[1160px]">{children}</div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}