"use client";

import { EmptyState, ErrorState, LoadingState, StatusBadge } from "@/components/DataState";
import { useUnits } from "@/features/master-data/useMasterData";

export default function UnitsPage() {
  const { status, data, error } = useUnits();

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={error ?? "Gagal memuat data."} />;
  if (!data || data.length === 0)
    return <EmptyState message="Belum ada unit. Tambahkan unit pertama." />;

  return (
    <table className="w-full border-collapse text-left text-sm">
      <caption className="sr-only">Daftar unit</caption>
      <thead>
        <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
          <th scope="col" className="py-2 pr-4 font-medium">
            Nama Unit
          </th>
          <th scope="col" className="py-2 pr-4 font-medium">
            Proyek
          </th>
          <th scope="col" className="py-2 font-medium">
            Status
          </th>
        </tr>
      </thead>
      <tbody>
        {data.map((unit) => (
          <tr key={unit.id} className="border-b border-zinc-100">
            <td className="py-2 pr-4 text-zinc-900">{unit.name}</td>
            <td className="py-2 pr-4 text-zinc-600">{unit.projects.length}</td>
            <td className="py-2">
              <StatusBadge active={unit.isActive} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}