"use client";

import { useToast } from "@/components/Toast";
import { useProjects, useUnits } from "@/features/master-data/useMasterData";
import {
  MasterDataSection,
  type MasterDataItem,
} from "@/features/master-data/MasterDataSection";
import { useProjectMutations } from "@/features/master-data/useMasterDataMutations";

type Project = MasterDataItem & { unit: { id: string; name: string } };

export default function ProjectsPage() {
  const { status, data, error } = useProjects();
  const units = useUnits();
  const projectMutations = useProjectMutations();
  const { pushToast } = useToast();

  async function detectError(fn: () => Promise<unknown>, ok: string) {
    try {
      await fn();
      pushToast("success", ok);
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : "Gagal menyimpan initiative.");
    }
  }

  return (
    <MasterDataSection<Project>
      caption="Daftar initiative"
      emptyMessage="Belum ada initiative. Tambahkan initiative pertama."
      addLabel="Tambah Initiative"
      nameLabel="Nama Initiative"
      items={data}
      status={status}
      error={error}
      searchable
      select={{
        label: "Unit",
        placeholder: "pilih unit pemilik —",
        options: (units.data ?? []).map((u) => ({ id: u.id, name: u.name })),
      }}
      selectRequired
      selectIdOf={(project) => project.unit.id}
      extraColumn={{ label: "Unit", render: (project) => project.unit.name }}
      onCreate={({ name, selectValue }) =>
        detectError(() => projectMutations.create({ name, selectValue }), `Initiative "${name}" berhasil dibuat.`)
      }
      onUpdate={(id, { name, selectValue }) =>
        detectError(() => projectMutations.update(id, { name, selectValue }), "Initiative berhasil diubah.")
      }
      onToggleActive={(id, isActive) =>
        detectError(
          () => projectMutations.toggleActive(id, isActive),
          isActive ? "Initiative berhasil diaktifkan." : "Initiative berhasil dinonaktifkan.",
        )
      }
    />
  );
}