"use client";

import { useToast } from "@/components/Toast";
import { useUnits } from "@/features/master-data/useMasterData";
import {
  MasterDataSection,
  type MasterDataItem,
} from "@/features/master-data/MasterDataSection";
import { useUnitMutations } from "@/features/master-data/useMasterDataMutations";

type Unit = MasterDataItem & { code: string; projects: { length: number } };

export default function UnitsPage() {
  const { status, data, error } = useUnits();
  const unitMutations = useUnitMutations();
  const { pushToast } = useToast();

  async function detectError(fn: () => Promise<unknown>, ok: string) {
    try {
      await fn();
      pushToast("success", ok);
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : "Gagal menyimpan unit.");
    }
  }

  return (
    <MasterDataSection<Unit>
      caption="Daftar unit"
      emptyMessage="Belum ada unit. Tambahkan unit pertama."
      addLabel="Tambah Unit"
      nameLabel="Nama Unit"
      codeLabel="Kode Unit"
      codePlaceholder="cth: DBT"
      codeOf={(unit) => unit.code}
      items={data}
      status={status}
      error={error}
      searchable
      extraColumn={{ label: "Proyek", render: (unit) => unit.projects.length }}
      onCreate={({ name, code }) =>
        detectError(
          () => unitMutations.create({ name, code }),
          `Unit "${name}" berhasil dibuat.`,
        )
      }
      onUpdate={(id, { name, code }) =>
        detectError(() => unitMutations.update(id, { name, code }), "Unit berhasil diubah.")
      }
      onToggleActive={(id, isActive) =>
        detectError(
          () => unitMutations.toggleActive(id, isActive),
          isActive ? "Unit berhasil diaktifkan." : "Unit berhasil dinonaktifkan.",
        )
      }
    />
  );
}