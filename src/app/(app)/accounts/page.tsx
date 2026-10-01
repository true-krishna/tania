"use client";

import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { roleLabel } from "@/features/accounts/mock";
import { useUsers } from "@/features/accounts/useAccounts";

function RoleBadge({ role }: { role: string }) {
  return (
    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
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
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Akun Pengguna</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Kelola akun dan peran akses di sistem Tania.
        </p>
      </div>
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">Daftar akun pengguna</caption>
        <thead>
          <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
            <th scope="col" className="py-2 pr-4 font-medium">
              Nama
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              Email
            </th>
            <th scope="col" className="py-2 pr-4 font-medium">
              Peran
            </th>
            <th scope="col" className="py-2 font-medium">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((user) => (
            <tr key={user.id} className="border-b border-zinc-100">
              <td className="py-2 pr-4 font-medium text-zinc-900">{user.fullName}</td>
              <td className="py-2 pr-4 text-zinc-600">{user.email}</td>
              <td className="py-2 pr-4">
                <RoleBadge role={user.accessRole} />
              </td>
              <td className="py-2 text-zinc-700">{user.status === "ACTIVE" ? "Aktif" : "Nonaktif"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}