"use client";

import { useToast } from "@/components/Toast";
import { useUnits } from "@/features/master-data/useMasterData";
import { MasterDataSection, type MasterDataItem } from "@/features/master-data/MasterDataSection";
import { MasterDataImportModal } from "@/features/master-data/MasterDataImportModal";
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
      addLabel="Tambah Unit"
      bulkEntity="unit"
      caption="Daftar unit"
      codeLabel="Kode Unit"
      codeOf={(unit) => unit.code}
      codePlaceholder="cth: DBT"
      emptyMessage="Belum ada unit. Tambahkan unit pertama."
      error={error}
      extraColumn={{ label: "Initiative", render: (unit) => unit.projects.length }}
      importSlot={({ close, onImported, open }) => (
        <MasterDataImportModal entity="unit" onClose={close} onImported={onImported} open={open} />
      )}
      items={data}
      nameLabel="Nama Unit"
      onCreate={({ name, code }) =>
        detectError(() => unitMutations.create({ name, code }), `Unit "${name}" berhasil dibuat.`)
      }
      onToggleActive={(id, isActive) =>
        detectError(
          () => unitMutations.toggleActive(id, isActive),
          isActive ? "Unit berhasil diaktifkan." : "Unit berhasil dinonaktifkan.",
        )
      }
      onUpdate={(id, { name, code }) =>
        detectError(() => unitMutations.update(id, { name, code }), "Unit berhasil diubah.")
      }
      searchable
      status={status}
    />
  );
}
