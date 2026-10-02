"use client";

import { BoardTable } from "@/components/BoardTable";
import { EmptyState, ErrorState, LoadingState, StatusBadge } from "@/components/DataState";
import { useChapters } from "@/features/master-data/useMasterData";

export default function ChaptersPage() {
  const { status, data, error } = useChapters();

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={error ?? "Gagal memuat data."} />;
  if (!data || data.length === 0)
    return <EmptyState message="Belum ada chapter. Tambahkan chapter pertama." />;

  return (
    <BoardTable
      caption="Daftar chapter"
      columns={[
        { key: "name", label: "Nama Chapter" },
        { key: "roles", label: "Job Role" },
        { key: "status", label: "Status" },
      ]}
    >
      {data.map((chapter) => (
        <tr key={chapter.id} className="border-b border-board-border transition-colors hover:bg-zinc-50">
          <td className="px-4 py-2.5 text-zinc-900">{chapter.name}</td>
          <td className="px-4 py-2.5 text-zinc-600">
            {chapter.jobRoles.map((r) => r.name).join(", ") || "—"}
          </td>
          <td className="px-4 py-2.5">
            <StatusBadge active={chapter.isActive} />
          </td>
        </tr>
      ))}
    </BoardTable>
  );
}