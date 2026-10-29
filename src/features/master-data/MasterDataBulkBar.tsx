"use client";

import * as React from "react";
import { Button } from "@/components/Button";
import { InputControl } from "@/components/InputControl";
import { Modal, ModalActions, ModalContent, ModalTitle } from "@/components/Modal";
import { Select } from "@/components/Select";
import { useToast } from "@/components/Toast";
import {
  MASTER_DATA_IMPORT_TEMPLATES,
  type MasterDataImportEntity,
} from "./masterDataImportTemplate";
import { MasterDataBulkReport } from "./MasterDataBulkReport";
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

function useBulkDialogClose(onClose: () => void, onClear: () => void) {
  const attemptedRef = React.useRef(false);
  const markAttempted = React.useCallback(() => {
    attemptedRef.current = true;
  }, []);
  const handleClose = React.useCallback(() => {
    if (attemptedRef.current) onClear();
    onClose();
  }, [onClear, onClose]);
  return { markAttempted, handleClose };
}

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
      title: isActive ? `Hasil Aktifkan Massal ${config.label}` : `Hasil Nonaktif Massal ${config.label}`,
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
        <Button disabled={running} onClick={() => void runActive(true)} type="button" variant="secondary">
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
            <Button disabled={running} onClick={deactivateDialog.handleClose} type="button" variant="secondary">
              {deactivateResult ? "Tutup" : "Batal"}
            </Button>
            {deactivateResult ? null : (
              <Button
                disabled={running}
                onClick={() => void confirmDeactivate()}
                type="button"
              >
                {running ? "Menyimpan…" : `Nonaktifkan ${rows.length} ${noun}`}
              </Button>
            )}
          </ModalActions>
        </Modal>
      ) : null}
      {changeOpen && target ? (
        <BulkChangeModal
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

function BulkChangeModal({
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
      const report = await run(
        entity,
        { kind: "change-select", value },
        rows,
        (current, total) => setProgress(total > 1 ? { current, total } : null),
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
        <form aria-label={`Ubah ${target.label} Massal`} className="flex flex-col gap-4" id={formId} onSubmit={onSubmit}>
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
