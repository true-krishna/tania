"use client";

import { BoardTable } from "@/components/BoardTable";
import { EmptyState, ErrorState, LoadingState, StatusBadge } from "@/components/DataState";
import { useUnits } from "@/features/master-data/useMasterData";

export default function UnitsPage() {
  const { status, data, error } = useUnits();

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={error ?? "Gagal memuat data."} />;
  if (!data || data.length === 0)
    return <EmptyState message="Belum ada unit. Tambahkan unit pertama." />;

  return (
    <BoardTable
      caption="Daftar unit"
      columns={[
        { key: "name", label: "Nama Unit" },
        { key: "projects", label: "Proyek" },
        { key: "status", label: "Status" },
      ]}
    >
      {data.map((unit) => (
        <tr key={unit.id} className="border-b border-board-border transition-colors hover:bg-zinc-50">
          <td className="px-4 py-2.5 text-zinc-900">{unit.name}</td>
          <td className="px-4 py-2.5 text-zinc-600">{unit.projects.length}</td>
          <td className="px-4 py-2.5">
            <StatusBadge active={unit.isActive} />
          </td>
        </tr>
      ))}
    </BoardTable>
  );
}