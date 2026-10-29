"use client";

import * as React from "react";
import { Button } from "@/components/Button";
import { InputControl } from "@/components/InputControl";
import { Modal, ModalActions, ModalContent, ModalTitle } from "@/components/Modal";
import { Select } from "@/components/Select";
import { useToast } from "@/components/Toast";
import type { MasterDataBulkTarget } from "./MasterDataBulkBar";
import { MasterDataBulkReport } from "./MasterDataBulkReport";
import type { MasterDataImportEntity } from "./masterDataImportTemplate";
import { useBulkDialogClose } from "./useBulkDialogClose";
import type {
  MasterDataBulkSelectionRow,
  useMasterDataBulkActions,
} from "./useMasterDataBulkActions";
import type { MergedImportReport } from "./useMasterDataImport";

export function MasterDataBulkChangeModal({
  entity,
  noun,
  onClose,
  onClear,
  rows,
  run,
  target,
}: {
  entity: MasterDataImportEntity;
  noun: string;
  onClose: () => void;
  onClear: () => void;
  rows: readonly MasterDataBulkSelectionRow[];
  run: ReturnType<typeof useMasterDataBulkActions>["run"];
  target: MasterDataBulkTarget;
}) {
  const [value, setValue] = React.useState("");
  const [valueError, setValueError] = React.useState<string | undefined>();
  const [running, setRunning] = React.useState(false);
  const [progress, setProgress] = React.useState<{ current: number; total: number } | null>(null);
  const [result, setResult] = React.useState<MergedImportReport | null>(null);
  const { pushToast } = useToast();
  const dialog = useBulkDialogClose(onClose, onClear);
  const formId = React.useId();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (target.required && !value) {
      setValueError(`${target.label} wajib dipilih.`);
      return;
    }
    setRunning(true);
    try {
      const report = await run(entity, { kind: "change-select", value }, rows, (current, total) =>
        setProgress(total > 1 ? { current, total } : null),
      );
      setProgress(null);
      setResult(report);
      dialog.markAttempted();
      if (report.failed.length === 0 && !report.stopReason) {
        pushToast("success", `${report.succeeded.length} ${noun} berhasil diubah massal.`);
        onClear();
        onClose();
      }
    } finally {
      setRunning(false);
      setProgress(null);
    }
  }

  const firstOptionLabel = target.required
    ? `Pilih ${target.label.toLowerCase()}`
    : `Tanpa ${target.label.toLowerCase()} (lepas)`;

  return (
    <Modal onClose={dialog.handleClose} open size="md">
      <ModalTitle>{`Ubah ${target.label} Massal`}</ModalTitle>
      <ModalContent>
        <form
          aria-label={`Ubah ${target.label} Massal`}
          className="flex flex-col gap-4"
          id={formId}
          onSubmit={onSubmit}
        >
          {result ? (
            <MasterDataBulkReport
              formatEntry={(entry) => entry.label}
              hint="Baris yang berhasil tetap tersimpan; baris yang ditolak perlu ditindaklanjuti sesuai alasannya."
              report={result}
              stopPrefix="Aksi dihentikan"
            />
          ) : (
            <>
              <p className="text-sm text-tp-muted">
                Perubahan yang sama diterapkan ke {rows.length} {noun} terpilih.
              </p>
              <InputControl error={valueError} label={target.label}>
                <Select
                  onChange={(e) => setValue(e.target.value)}
                  options={[
                    { value: "", label: `— ${firstOptionLabel} —` },
                    ...target.options.map((o) => ({ value: o.id, label: o.name })),
                  ]}
                  value={value}
                />
              </InputControl>
            </>
          )}
          {running && progress ? (
            <p aria-live="polite" className="text-sm text-tp-muted">
              Memproses potongan {progress.current} dari {progress.total}…
            </p>
          ) : null}
        </form>
      </ModalContent>
      <ModalActions>
        <Button disabled={running} onClick={dialog.handleClose} type="button" variant="secondary">
          {result ? "Tutup" : "Batal"}
        </Button>
        <Button disabled={running} form={formId} type="submit">
          {running ? "Menyimpan…" : `Terapkan ke ${rows.length} ${noun}`}
        </Button>
      </ModalActions>
    </Modal>
  );
}
