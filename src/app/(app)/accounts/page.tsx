"use client";

import Link from "next/link";
import { useToast } from "@/components/Toast";
import { AccountsSection } from "@/features/accounts/AccountsSection";
import { useUsers } from "@/features/accounts/useAccounts";
import { useAccountMutations } from "@/features/accounts/useAccountMutations";
import { useRoles } from "@/features/roles/useRoles";
import { ROLES_ADMIN } from "@/lib/constants/routes";

export default function AccountsPage() {
  const { status, data, error } = useUsers();
  // Access roles come from the API, so a custom role is assignable here (W3).
  const { data: roles } = useRoles();
  const accountMutations = useAccountMutations();
  const { pushToast } = useToast();

  async function report(fn: () => Promise<unknown>, ok: string) {
    try {
      await fn();
      pushToast("success", ok);
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : "Gagal menyimpan data akun.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* The configuration page lives under the Accounts entry instead of a menu
       * of its own: the menu catalog is what it configures, and a 22nd entry
       * would move the default-parity invariant (W2/W4). */}
      <div className="flex justify-end">
        <Link href={ROLES_ADMIN} className="tp-btn">
          Menu &amp; Akses per Role
        </Link>
      </div>
      <AccountsSection
        accounts={data}
        roles={roles}
        status={status}
        error={error}
        onCreate={async (values) => {
          await accountMutations.create(values);
          pushToast("success", `Akun "${values.email}" berhasil dibuat.`);
        }}
        onChangeRole={(userId, roleName) =>
          report(
            () => accountMutations.changeRole(userId, roleName),
            "Peran akses berhasil diubah.",
          )
        }
        onSetStatus={(userId, next) =>
          report(
            () => accountMutations.setStatus(userId, next),
            next === "ACTIVE" ? "Akun berhasil diaktifkan." : "Akun berhasil dinonaktifkan.",
          )
        }
        onRevokeSessions={(userId) =>
          report(() => accountMutations.revokeSessions(userId), "Sesi pengguna berhasil dicabut.")
        }
      />
    </div>
  );
}
