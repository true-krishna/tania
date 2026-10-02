"use client";

import { BoardTable } from "@/components/BoardTable";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { roleLabel } from "@/features/accounts/mock";
import { useUsers } from "@/features/accounts/useAccounts";

function RoleBadge({ role }: { role: string }) {
  return (
    <span className="rounded-md bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
      {roleLabel[role as keyof typeof roleLabel] ?? role}
    </span>
  );
}

export default function AccountsPage() {
  const { status, data, error } = useUsers();

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={error ?? "Gagal memuat data."} />;
  if (!data || data.length === 0)
    return <EmptyState message="Belum ada akun pengguna." />;

  return (
    <section className="flex flex-col gap-4">
      <PageHeader title="Akun Pengguna" subtitle="Kelola akun dan peran akses di sistem Tania." />
      <BoardTable
        caption="Daftar akun pengguna"
        columns={[
          { key: "name", label: "Nama" },
          { key: "email", label: "Email" },
          { key: "role", label: "Peran" },
          { key: "status", label: "Status" },
        ]}
      >
        {data.map((user) => (
          <tr key={user.id} className="border-b border-board-border transition-colors hover:bg-zinc-50">
            <td className="px-4 py-2.5 font-medium text-zinc-900">{user.fullName}</td>
            <td className="px-4 py-2.5 text-zinc-600">{user.email}</td>
            <td className="px-4 py-2.5">
              <RoleBadge role={user.accessRole} />
            </td>
            <td className="px-4 py-2.5 text-zinc-700">
              {user.status === "ACTIVE" ? "Aktif" : "Nonaktif"}
            </td>
          </tr>
        ))}
      </BoardTable>
    </section>
  );
}