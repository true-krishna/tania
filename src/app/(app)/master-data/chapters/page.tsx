"use client";

import { EmptyState, ErrorState, LoadingState, StatusBadge } from "@/components/DataState";
import { useChapters } from "@/features/master-data/useMasterData";

export default function ChaptersPage() {
  const { status, data, error } = useChapters();

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={error ?? "Gagal memuat data."} />;
  if (!data || data.length === 0)
    return <EmptyState message="Belum ada chapter. Tambahkan chapter pertama." />;

  return (
    <table className="w-full border-collapse text-left text-sm">
      <caption className="sr-only">Daftar chapter</caption>
      <thead>
        <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
          <th scope="col" className="py-2 pr-4 font-medium">
            Nama Chapter
          </th>
          <th scope="col" className="py-2 pr-4 font-medium">
            Job Role
          </th>
          <th scope="col" className="py-2 font-medium">
            Status
          </th>
        </tr>
      </thead>
      <tbody>
        {data.map((chapter) => (
          <tr key={chapter.id} className="border-b border-zinc-100">
            <td className="py-2 pr-4 text-zinc-900">{chapter.name}</td>
            <td className="py-2 pr-4 text-zinc-600">
              {chapter.jobRoles.map((r) => r.name).join(", ") || "—"}
            </td>
            <td className="py-2">
              <StatusBadge active={chapter.isActive} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}