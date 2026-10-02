"use client";

import { BoardTable } from "@/components/monday";
import { EmptyState, ErrorState, LoadingState, StatusBadge } from "@/components/DataState";
import { useProjects } from "@/features/master-data/useMasterData";

export default function ProjectsPage() {
  const { status, data, error } = useProjects();

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={error ?? "Gagal memuat data."} />;
  if (!data || data.length === 0)
    return <EmptyState message="Belum ada proyek. Tambahkan proyek pertama." />;

  return (
    <BoardTable
      caption="Daftar proyek"
      columns={[
        { key: "name", label: "Nama Proyek" },
        { key: "unit", label: "Unit" },
        { key: "status", label: "Status" },
      ]}
    >
      {data.map((project) => (
        <tr key={project.id} className="border-b border-board-border transition-colors hover:bg-zinc-50">
          <td className="px-4 py-2.5 text-zinc-900">{project.name}</td>
          <td className="px-4 py-2.5 text-zinc-600">{project.unit.name}</td>
          <td className="px-4 py-2.5">
            <StatusBadge active={project.isActive} />
          </td>
        </tr>
      ))}
    </BoardTable>
  );
}