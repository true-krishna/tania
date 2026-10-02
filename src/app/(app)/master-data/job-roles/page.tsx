"use client";

import { BoardTable } from "@/components/BoardTable";
import { EmptyState, ErrorState, LoadingState, StatusBadge } from "@/components/DataState";
import { useJobRoles } from "@/features/master-data/useMasterData";

export default function JobRolesPage() {
  const { status, data, error } = useJobRoles();

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={error ?? "Gagal memuat data."} />;
  if (!data || data.length === 0)
    return <EmptyState message="Belum ada job role. Tambahkan job role pertama." />;

  return (
    <BoardTable
      caption="Daftar job role"
      columns={[
        { key: "name", label: "Nama Job Role" },
        { key: "chapter", label: "Chapter" },
        { key: "status", label: "Status" },
      ]}
    >
      {data.map((role) => (
        <tr key={role.id} className="border-b border-board-border transition-colors hover:bg-zinc-50">
          <td className="px-4 py-2.5 text-zinc-900">{role.name}</td>
          <td className="px-4 py-2.5 text-zinc-600">{role.chapter?.name ?? "Tanpa chapter"}</td>
          <td className="px-4 py-2.5">
            <StatusBadge active={role.isActive} />
          </td>
        </tr>
      ))}
    </BoardTable>
  );
}