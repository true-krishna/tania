"use client";

import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { useMutation } from "@apollo/client";
import { LogoutDocument } from "@/generated/graphql";
import { IconChartBar, IconClockHour3, IconUser } from "@tabler/icons-react";
import { Sidebar, sectionForPath } from "@/components/Sidebar";
import { UserMenu } from "@/components/UserMenu";
import { AssistantBubble } from "@/features/assistant/AssistantBubble";
import { roleLabel } from "@/features/accounts/roles";
import { authConfig } from "@/lib/auth/config";
import { AuthGuard, useSessionRole } from "@/lib/auth/guard";
import { onSessionExpired } from "@/lib/auth/session-expiry";
import { clearSession, getSession } from "@/lib/auth/token-store";
import { ACTIVITIES, LOGIN, PROFILE, WORKLOAD } from "@/lib/constants/routes";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const role = useSessionRole();
  const pathname = usePathname();
  const [logout] = useMutation(LogoutDocument);

  // Session expiry while the app is open (refresh link failed and cleared the
  // session) routes back to sign-in; AuthGuard only covers the initial mount.
  React.useEffect(() => {
    if (authConfig.localOnly) return;
    return onSessionExpired(() => router.replace(LOGIN));
  }, [router]);

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
      router.replace(LOGIN);
    }
  }

  return (
    <AuthGuard>
      {/* Shell per constitution-design v4.3.0 §VIII: 268px sticky sidebar,
       * topbar 16px 24px, main 24px fluid with no content cap — the content
       * fills the viewport minus the sidebar and adapts to large viewports;
       * ≤860px the sidebar strip is static and paddings tighten. */}
      <div className="flex min-h-screen flex-col min-[861px]:flex-row">
        <Sidebar role={role} pathname={pathname} />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-tp-line bg-tp-surface px-4 py-3 min-[861px]:px-6 min-[861px]:py-4">
            <p className="truncate text-sm font-semibold text-zinc-700">{sectionForPath(pathname)}</p>
            <div className="flex items-center gap-3">
              <UserMenu
                name={displayName}
                email={session?.email}
                roleLabel={role ? roleLabel[role] : null}
                items={[
                  { href: PROFILE, label: "Profil saya", icon: IconUser },
                  { href: ACTIVITIES, label: "Aktivitas saya", icon: IconClockHour3 },
                  { href: WORKLOAD, label: "Workload", icon: IconChartBar },
                ]}
                onLogout={handleLogout}
              />
            </div>
          </header>
          <main className="flex-1 px-4 py-4 min-[861px]:px-6 min-[861px]:py-6">
            {children}
          </main>
        </div>
      </div>
      {/* Asisten data (FR-01): bubble + panel dirender sekali di shell, hanya
       * untuk CHAPTER/OPERATION. Guard ini kenyamanan UI — otorisasi ada di
       * server (ChatService). */}
      {(role === "CHAPTER" || role === "OPERATION") && <AssistantBubble />}
    </AuthGuard>
  );
}