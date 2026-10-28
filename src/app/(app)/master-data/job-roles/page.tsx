"use client";

import { useToast } from "@/components/Toast";
import { useChapters, useJobRoles } from "@/features/master-data/useMasterData";
import {
  MasterDataSection,
  type MasterDataItem,
} from "@/features/master-data/MasterDataSection";
import { MasterDataImportModal } from "@/features/master-data/MasterDataImportModal";
import { useJobRoleMutations } from "@/features/master-data/useMasterDataMutations";

type JobRole = MasterDataItem & { chapter?: { id: string; name: string } | null };

export default function JobRolesPage() {
  const { status, data, error } = useJobRoles();
  const chapters = useChapters();
  const jobRoleMutations = useJobRoleMutations();
  const { pushToast } = useToast();

  async function detectError(fn: () => Promise<unknown>, ok: string) {
    try {
      await fn();
      pushToast("success", ok);
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : "Gagal menyimpan job role.");
    }
  }

  return (
    <MasterDataSection<JobRole>
      addLabel="Tambah Job Role"
      bulkEntity="jobRole"
      caption="Daftar job role"
      emptyMessage="Belum ada job role. Tambahkan job role pertama."
      error={error}
      extraColumn={{ label: "Chapter", render: (role) => role.chapter?.name ?? "Tanpa chapter" }}
      importSlot={({ close, onImported, open }) => (
        <MasterDataImportModal entity="jobRole" onClose={close} onImported={onImported} open={open} />
      )}
      items={data}
      nameLabel="Nama Job Role"
      onCreate={({ name, selectValue }) =>
        detectError(() => jobRoleMutations.create({ name, selectValue }), `Job role "${name}" berhasil dibuat.`)
      }
      onToggleActive={(id, isActive) =>
        detectError(
          () => jobRoleMutations.toggleActive(id, isActive),
          isActive ? "Job role berhasil diaktifkan." : "Job role berhasil dinonaktifkan.",
        )
      }
      onUpdate={(id, { name, selectValue }) =>
        detectError(async () => {
          await jobRoleMutations.update(id, { name });
          await jobRoleMutations.changeChapter(id, selectValue || null);
        }, "Job role berhasil diubah.")
      }
      searchable
      select={{
        label: "Chapter",
        placeholder: "pilih chapter (boleh kosong) —",
        options: (chapters.data ?? []).map((c) => ({ id: c.id, name: c.name })),
      }}
      selectIdOf={(role) => role.chapter?.id}
      status={status}
    />
  );
}