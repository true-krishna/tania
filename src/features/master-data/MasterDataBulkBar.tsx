"use client";

import * as React from "react";
import { Button } from "@/components/Button";
import { Modal, ModalActions, ModalContent, ModalTitle } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import {
  MASTER_DATA_IMPORT_TEMPLATES,
  type MasterDataImportEntity,
} from "./masterDataImportTemplate";
import { MasterDataBulkChangeModal } from "./MasterDataBulkChangeModal";
import { MasterDataBulkReport } from "./MasterDataBulkReport";
import { useBulkDialogClose } from "./useBulkDialogClose";
import {
  useMasterDataBulkActions,
  type MasterDataBulkSelectionRow,
} from "./useMasterDataBulkActions";
import type { MergedImportReport } from "./useMasterDataImport";

export type MasterDataBulkTarget = {
  label: string;
  options: readonly { id: string; name: string }[];
  required: boolean;
};

type MasterDataBulkBarProps = {
  entity: MasterDataImportEntity;
  rows: readonly MasterDataBulkSelectionRow[];
  target?: MasterDataBulkTarget;
  onClear: () => void;
};

export function MasterDataBulkBar({ entity, rows, target, onClear }: MasterDataBulkBarProps) {
  const config = MASTER_DATA_IMPORT_TEMPLATES[entity];
  const noun = config.label.toLowerCase();
  const { run } = useMasterDataBulkActions();
  const { pushToast } = useToast();

  const [running, setRunning] = React.useState(false);
  const [progress, setProgress] = React.useState<{ current: number; total: number } | null>(null);
  const [deactivateOpen, setDeactivateOpen] = React.useState(false);
  const [deactivateError, setDeactivateError] = React.useState<string | null>(null);
  const [deactivateResult, setDeactivateResult] = React.useState<MergedImportReport | null>(null);
  const [changeOpen, setChangeOpen] = React.useState(false);
  const [resultDialog, setResultDialog] = React.useState<{
    title: string;
    report: MergedImportReport;
  } | null>(null);

  const onProgress = React.useCallback((current: number, total: number) => {
    setProgress(total > 1 ? { current, total } : null);
  }, []);

  const deactivateDialog = useBulkDialogClose(() => setDeactivateOpen(false), onClear);
  const resultDialogClose = useBulkDialogClose(() => setResultDialog(null), onClear);

  async function execute(action: Parameters<typeof run>[1]) {
    setRunning(true);
    try {
      return await run(entity, action, rows, onProgress);
    } finally {
      setRunning(false);
      setProgress(null);
    }
  }

  async function runActive(isActive: boolean) {
    const report = await execute({ kind: "set-active", isActive });
    if (report.failed.length === 0 && !report.stopReason) {
      pushToast(
        "success",
        `${report.succeeded.length} ${noun} berhasil ${isActive ? "diaktifkan" : "dinonaktifkan"} massal.`,
      );
      onClear();
      return;
    }
    resultDialogClose.markAttempted();
    setResultDialog({
      report,
      title: isActive
        ? `Hasil Aktifkan Massal ${config.label}`
        : `Hasil Nonaktif Massal ${config.label}`,
    });
  }

  function closeResultDialog() {
    resultDialogClose.handleClose();
  }

  return (
    <>
      <div
        aria-label={`Aksi massal ${config.label}`}
        className="flex flex-wrap items-center gap-2 rounded-lg border border-tp-line bg-tp-bg px-3 py-2"
        role="toolbar"
      >
        <span className="text-sm font-medium text-tp-text">{rows.length} dipilih</span>
        <span className="flex-1" />
        {target ? (
          <Button
            disabled={running}
            onClick={() => setChangeOpen(true)}
            type="button"
            variant="secondary"
          >
            Ubah {target.label}…
          </Button>
        ) : null}
        <Button
          disabled={running}
          onClick={() => void runActive(true)}
          type="button"
          variant="secondary"
        >
          Aktifkan
        </Button>
        <Button
          disabled={running}
          onClick={() => setDeactivateOpen(true)}
          type="button"
          variant="secondary"
        >
          Nonaktifkan
        </Button>
        <Button disabled={running} onClick={onClear} type="button" variant="ghost">
          Bersihkan
        </Button>
      </div>
      {running && progress ? (
        <p aria-live="polite" className="text-sm text-tp-muted">
          Memproses potongan {progress.current} dari {progress.total}…
        </p>
      ) : null}
      {deactivateOpen ? (
        <Modal onClose={deactivateDialog.handleClose} open size="md">
          <ModalTitle>{`Nonaktifkan ${rows.length} ${config.label}`}</ModalTitle>
          <ModalContent>
            <div className="flex flex-col gap-4">
              {deactivateError ? (
                <p className="text-sm text-red-700" role="alert">
                  {deactivateError}
                </p>
              ) : null}
              {deactivateResult ? (
                <MasterDataBulkReport
                  formatEntry={(entry) => entry.label}
                  hint="Baris yang berhasil tetap tersimpan; baris yang ditolak perlu ditindaklanjuti sesuai alasannya."
                  report={deactivateResult}
                  stopPrefix="Aksi dihentikan"
                />
              ) : (
                <>
                  <p className="text-sm text-tp-text">
                    Nonaktifkan {rows.length} {noun} terpilih? Baris yang masih direferensikan data
                    lain akan ditolak oleh sistem dengan penjelasannya.
                  </p>
                  <ul className="flex max-h-40 flex-col gap-1 overflow-auto text-sm text-tp-muted">
                    {rows.map((row) => (
                      <li key={row.id}>{row.label}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </ModalContent>
          <ModalActions>
            <Button
              disabled={running}
              onClick={deactivateDialog.handleClose}
              type="button"
              variant="secondary"
            >
              {deactivateResult ? "Tutup" : "Batal"}
            </Button>
            {deactivateResult ? null : (
              <Button disabled={running} onClick={() => void confirmDeactivate()} type="button">
                {running ? "Menyimpan…" : `Nonaktifkan ${rows.length} ${noun}`}
              </Button>
            )}
          </ModalActions>
        </Modal>
      ) : null}
      {changeOpen && target ? (
        <MasterDataBulkChangeModal
          entity={entity}
          noun={noun}
          onClear={onClear}
          onClose={() => setChangeOpen(false)}
          rows={rows}
          run={run}
          target={target}
        />
      ) : null}
      {resultDialog ? (
        <Modal onClose={closeResultDialog} open size="md">
          <ModalTitle>{resultDialog.title}</ModalTitle>
          <ModalContent>
            <MasterDataBulkReport
              formatEntry={(entry) => entry.label}
              hint="Baris yang berhasil tetap tersimpan; baris yang ditolak perlu ditindaklanjuti sesuai alasannya."
              report={resultDialog.report}
              stopPrefix="Aksi dihentikan"
            />
          </ModalContent>
          <ModalActions>
            <Button onClick={closeResultDialog} type="button" variant="secondary">
              Tutup
            </Button>
          </ModalActions>
        </Modal>
      ) : null}
    </>
  );

  async function confirmDeactivate() {
    setDeactivateError(null);
    const report = await execute({ kind: "set-active", isActive: false });
    deactivateDialog.markAttempted();
    setDeactivateResult(report);
    if (report.failed.length === 0 && !report.stopReason) {
      pushToast("success", `${report.succeeded.length} ${noun} berhasil dinonaktifkan massal.`);
      setDeactivateOpen(false);
      onClear();
    }
  }
}
