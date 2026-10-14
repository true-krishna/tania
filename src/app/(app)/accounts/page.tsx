"use client";

import { useToast } from "@/components/Toast";
import { AccountsSection } from "@/features/accounts/AccountsSection";
import { useUsers } from "@/features/accounts/useAccounts";
import { useAccountMutations } from "@/features/accounts/useAccountMutations";

export default function AccountsPage() {
  const { status, data, error } = useUsers();
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
    <AccountsSection
      accounts={data}
      status={status}
      error={error}
      onCreate={async (values) => {
        await accountMutations.create(values);
        pushToast("success", `Akun "${values.email}" berhasil dibuat.`);
      }}
      onChangeRole={(userId, accessRole) =>
        report(
          () => accountMutations.changeRole(userId, accessRole),
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
  );
}
