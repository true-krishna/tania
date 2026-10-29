"use client";

import Link from "next/link";
import { useToast } from "@/components/Toast";
import { AccountsSection } from "@/features/accounts/AccountsSection";
import { useUsers } from "@/features/accounts/useAccounts";
import { useAccountMutations } from "@/features/accounts/useAccountMutations";
import { useRoles } from "@/features/roles/useRoles";
import { ROLES_ADMIN } from "@/lib/constants/routes";
import { errorText } from "@/lib/errors";

export default function AccountsPage() {
  const { status, data, error } = useUsers();
  const { data: roles } = useRoles();
  const accountMutations = useAccountMutations();
  const { pushToast } = useToast();

  async function report(fn: () => Promise<unknown>, ok: string) {
    try {
      await fn();
      pushToast("success", ok);
    } catch (err) {
      pushToast("error", errorText(err, "Gagal menyimpan data akun."));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Link className="tp-btn" href={ROLES_ADMIN}>
          Menu &amp; Akses per Role
        </Link>
      </div>
      <AccountsSection
        accounts={data}
        error={error}
        onChangeRole={(userId, roleName) =>
          report(
            () => accountMutations.changeRole(userId, roleName),
            "Peran akses berhasil diubah.",
          )
        }
        onCreate={async (values) => {
          await accountMutations.create(values);
          pushToast("success", `Akun "${values.email}" berhasil dibuat.`);
        }}
        onRevokeSessions={(userId) =>
          report(() => accountMutations.revokeSessions(userId), "Sesi pengguna berhasil dicabut.")
        }
        onSetStatus={(userId, next) =>
          report(
            () => accountMutations.setStatus(userId, next),
            next === "ACTIVE" ? "Akun berhasil diaktifkan." : "Akun berhasil dinonaktifkan.",
          )
        }
        roles={roles}
        status={status}
      />
    </div>
  );
}
