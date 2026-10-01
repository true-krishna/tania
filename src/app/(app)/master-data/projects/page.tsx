"use client";

import { EmptyState, ErrorState, LoadingState, StatusBadge } from "@/components/DataState";
import { useProjects } from "@/features/master-data/useMasterData";

export default function ProjectsPage() {
  const { status, data, error } = useProjects();

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={error ?? "Gagal memuat data."} />;
  if (!data || data.length === 0)
    return <EmptyState message="Belum ada proyek. Tambahkan proyek pertama." />;

  return (
    <table className="w-full border-collapse text-left text-sm">
      <caption className="sr-only">Daftar proyek</caption>
      <thead>
        <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
          <th scope="col" className="py-2 pr-4 font-medium">
            Nama Proyek
          </th>
          <th scope="col" className="py-2 pr-4 font-medium">
            Unit
          </th>
          <th scope="col" className="py-2 font-medium">
            Status
          </th>
        </tr>
      </thead>
      <tbody>
        {data.map((project) => (
          <tr key={project.id} className="border-b border-zinc-100">
            <td className="py-2 pr-4 text-zinc-900">{project.name}</td>
            <td className="py-2 pr-4 text-zinc-600">{project.unit.name}</td>
            <td className="py-2">
              <StatusBadge active={project.isActive} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}