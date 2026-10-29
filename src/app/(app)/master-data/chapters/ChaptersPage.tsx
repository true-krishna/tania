"use client";

import { useToast } from "@/components/Toast";
import { useChapters } from "@/features/master-data/useMasterData";
import { MasterDataSection, type MasterDataItem } from "@/features/master-data/MasterDataSection";
import { MasterDataImportModal } from "@/features/master-data/MasterDataImportModal";
import { useChapterMutations } from "@/features/master-data/useMasterDataMutations";

type Chapter = MasterDataItem & { jobRoles: { length: number } };

export default function ChaptersPage() {
  const { status, data, error } = useChapters();
  const chapterMutations = useChapterMutations();
  const { pushToast } = useToast();

  async function detectError(fn: () => Promise<unknown>, ok: string) {
    try {
      await fn();
      pushToast("success", ok);
    } catch (err) {
      pushToast("error", err instanceof Error ? err.message : "Gagal menyimpan chapter.");
    }
  }

  return (
    <MasterDataSection<Chapter>
      addLabel="Tambah Chapter"
      bulkEntity="chapter"
      caption="Daftar chapter"
      emptyMessage="Belum ada chapter. Tambahkan chapter pertama."
      error={error}
      extraColumn={{ label: "Job Role", render: (chapter) => chapter.jobRoles.length }}
      importSlot={({ close, onImported, open }) => (
        <MasterDataImportModal
          entity="chapter"
          onClose={close}
          onImported={onImported}
          open={open}
        />
      )}
      items={data}
      nameLabel="Nama Chapter"
      onCreate={({ name }) =>
        detectError(() => chapterMutations.create({ name }), `Chapter "${name}" berhasil dibuat.`)
      }
      onToggleActive={(id, isActive) =>
        detectError(
          () => chapterMutations.toggleActive(id, isActive),
          isActive ? "Chapter berhasil diaktifkan." : "Chapter berhasil dinonaktifkan.",
        )
      }
      onUpdate={(id, { name }) =>
        detectError(() => chapterMutations.update(id, { name }), "Chapter berhasil diubah.")
      }
      status={status}
    />
  );
}
