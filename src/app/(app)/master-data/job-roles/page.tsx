"use client";

import { EmptyState, ErrorState, LoadingState, StatusBadge } from "@/components/DataState";
import { useJobRoles } from "@/features/master-data/useMasterData";

export default function JobRolesPage() {
  const { status, data, error } = useJobRoles();

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={error ?? "Gagal memuat data."} />;
  if (!data || data.length === 0)
    return <EmptyState message="Belum ada job role. Tambahkan job role pertama." />;

  return (
    <table className="w-full border-collapse text-left text-sm">
      <caption className="sr-only">Daftar job role</caption>
      <thead>
        <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
          <th scope="col" className="py-2 pr-4 font-medium">
            Nama Job Role
          </th>
          <th scope="col" className="py-2 pr-4 font-medium">
            Chapter
          </th>
          <th scope="col" className="py-2 font-medium">
            Status
          </th>
        </tr>
      </thead>
      <tbody>
        {data.map((role) => (
          <tr key={role.id} className="border-b border-zinc-100">
            <td className="py-2 pr-4 text-zinc-900">{role.name}</td>
            <td className="py-2 pr-4 text-zinc-600">{role.chapter?.name ?? "Tanpa chapter"}</td>
            <td className="py-2">
              <StatusBadge active={role.isActive} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}