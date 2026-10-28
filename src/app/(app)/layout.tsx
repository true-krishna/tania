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
import { useMyMenuConfig } from "@/features/roles/useRoles";
import { resetApolloStore } from "@/lib/apollo";
import { MenuAccessProvider } from "@/lib/auth/access";
import { authConfig } from "@/lib/auth/config";
import { AuthGuard, useSession, useSessionRole } from "@/lib/auth/guard";
import { defaultEntryReadable, serverAllows } from "@/lib/auth/menuAccess";
import { onSessionExpired } from "@/lib/auth/session-expiry";
import { clearSession, getSession } from "@/lib/auth/token-store";
import { ACTIVITIES, LOGIN, PROFILE, WORKLOAD } from "@/lib/constants/routes";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const role = useSessionRole();
  const session = useSession();
  const { config: menuConfig, roleName, status: menuStatus } = useMyMenuConfig();
  const pathname = usePathname();
  const [logout] = useMutation(LogoutDocument);

  React.useEffect(() => {
    if (authConfig.localOnly) return;
    return onSessionExpired(() => router.replace(LOGIN));
  }, [router]);

  const displayName =
    session?.fullName?.trim() || session?.email?.split("@")[0] || (role ? roleLabel[role] : "Tania");
  const accessRoleName = roleName ?? session?.roleName ?? session?.accessRole ?? null;
  const accessConfig = React.useMemo(
    () => menuConfig ?? (menuStatus === "error" || menuStatus === "empty" ? {} : null),
    [menuConfig, menuStatus],
  );
  const assistantAllowed = React.useMemo(() => {
    if (accessConfig && accessRoleName) {
      return serverAllows(accessConfig, accessRoleName, "assistant", "READ");
    }
    return role != null && defaultEntryReadable(role, "assistant");
  }, [accessConfig, accessRoleName, role]);

  async function handleLogout() {
    const refreshToken = getSession()?.refreshToken;
    try {
      if (refreshToken) await logout({ variables: { refreshToken } });
    } finally {
      clearSession();
      await resetApolloStore();
      router.replace(LOGIN);
    }
  }

  return (
    <AuthGuard>
      <MenuAccessProvider config={accessConfig} roleName={accessRoleName}>
        <div className="flex min-h-screen flex-col min-[861px]:flex-row">
          <Sidebar
            menuConfig={menuConfig}
            menuStatus={menuStatus}
            pathname={pathname}
            role={role}
            roleName={roleName}
          />
          <div className="flex min-h-screen min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-tp-line bg-tp-surface px-4 py-3 min-[861px]:px-6 min-[861px]:py-4">
              <p className="truncate text-sm font-semibold text-zinc-700">{sectionForPath(pathname)}</p>
              <div className="flex items-center gap-3">
                <UserMenu
                  email={session?.email}
                  items={[
                    { href: PROFILE, label: "Profil saya", icon: IconUser },
                    { href: ACTIVITIES, label: "Aktivitas saya", icon: IconClockHour3 },
                    { href: WORKLOAD, label: "Workload", icon: IconChartBar },
                  ]}
                  name={displayName}
                  onLogout={handleLogout}
                  roleLabel={role ? roleLabel[role] : null}
                />
              </div>
            </header>
            <main className="flex-1 px-4 py-4 min-[861px]:px-6 min-[861px]:py-6">
              {children}
            </main>
          </div>
        </div>
        {assistantAllowed && <AssistantBubble />}
      </MenuAccessProvider>
    </AuthGuard>
  );
}