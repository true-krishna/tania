"use client";

import * as React from "react";
import { Button } from "@/components/Button";
import { InputControl } from "@/components/InputControl";
import { InputDropzone } from "@/components/InputDropzone";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import {
  MASTER_DATA_IMPORT_TEMPLATES,
  type MasterDataImportEntity,
  type MasterDataImportRow,
  parseMasterDataImportTemplate,
} from "./masterDataImportTemplate";
import {
  MASTER_DATA_IMPORT_MAX_ROWS,
  type MergedImportReport,
  useMasterDataBulkImport,
} from "./useMasterDataImport";

type MasterDataImportModalProps = {
  open: boolean;
  onClose: () => void;
  onImported?: () => void;
  entity: MasterDataImportEntity;
};

export function MasterDataImportModal({
  open,
  onClose,
  onImported,
  entity,
}: MasterDataImportModalProps) {
  const config = MASTER_DATA_IMPORT_TEMPLATES[entity];
  const noun = config.label.toLowerCase();
  const { run } = useMasterDataBulkImport();
  const [parsedRows, setParsedRows] = React.useState<MasterDataImportRow[] | null>(null);
  const [invalidRows, setInvalidRows] = React.useState<
    readonly { rowNumber: number; reason: string }[]
  >([]);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const [parsing, setParsing] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [running, setRunning] = React.useState(false);
  const [progress, setProgress] = React.useState<{ current: number; total: number } | null>(null);
  const [result, setResult] = React.useState<MergedImportReport | null>(null);
  const { pushToast } = useToast();

  const unfinishedRowNumbers = React.useMemo(() => {
    if (!result) return null;
    const rowNumbers = new Set<number>();
    for (const row of result.failed) rowNumbers.add(row.rowNumber);
    for (const row of result.notExecuted) rowNumbers.add(row.rowNumber);
    return rowNumbers;
  }, [result]);
  const retryRows =
    unfinishedRowNumbers && parsedRows
      ? parsedRows.filter((row) => unfinishedRowNumbers.has(row.rowNumber))
      : null;
  const rowsToSend = retryRows ?? parsedRows ?? [];
  const isRetry = retryRows !== null;
  const hasRows = rowsToSend.length > 0;

  function clearFile() {
    setParsedRows(null);
    setInvalidRows([]);
    setFileName(null);
    setFileError(null);
    setResult(null);
    setFormError(null);
  }

  async function acceptFile(file: File | null) {
    clearFile();
    if (!file) return;
    setParsing(true);
    try {
      const parsed = await parseMasterDataImportTemplate(entity, file);
      if (!parsed.ok) {
        setFileError(parsed.reason);
        return;
      }
      setParsedRows(parsed.rows);
      setInvalidRows(parsed.invalid);
      setFileName(file.name);
    } finally {
      setParsing(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!hasRows) {
      setFormError(
        isRetry
          ? "Tidak ada baris gagal untuk diulangi."
          : `Unggah berkas Excel berisi minimal satu baris ${noun} (kolom ${config.columns.join(", ")}).`,
      );
      return;
    }
    const submitting = rowsToSend;
    setRunning(true);
    try {
      const report = await run(entity, submitting, (current, total) => {
        if (total > 1) setProgress({ current, total });
      });
      setProgress(null);
      setResult(report);
      if (report.succeeded.length > 0) onImported?.();
      if (report.failed.length === 0 && !report.stopReason) {
        pushToast("success", `${report.succeeded.length} ${config.label} berhasil dibuat massal.`);
        onClose();
      }
    } finally {
      setProgress(null);
      setRunning(false);
    }
  }

  return (
    <Modal onClose={onClose} open={open} size="md" title={`Unggah Massal ${config.label}`}>
      <form aria-label={`Unggah Massal ${config.label}`} className="flex flex-col gap-4" onSubmit={onSubmit}>
        {formError ? (
          <p className="text-sm text-red-700" role="alert">
            {formError}
          </p>
        ) : null}
        {result ? (
          <div
            className="flex flex-col gap-2 rounded-lg border border-tp-line bg-tp-bg px-3 py-2 text-sm"
            role="status"
          >
            <p className="font-medium text-tp-text">
              {result.succeeded.length} baris berhasil
              {result.failed.length > 0 ? `, ${result.failed.length} gagal` : ""}
              {result.notExecuted.length > 0
                ? `, ${result.notExecuted.length} belum dieksekusi`
                : ""}
              .
            </p>
            {result.stopReason ? (
              <p className="text-red-700" role="alert">
                Impor dihentikan: {result.stopReason}
              </p>
            ) : null}
            {result.failed.length > 0 ? (
              <ul className="flex flex-col gap-1">
                {result.failed.map((row) => (
                  <li className="text-red-700" key={row.rowNumber}>
                    <span className="font-medium">Baris {row.rowNumber} ({row.label})</span>
                    {" — "}
                    {row.reason}
                  </li>
                ))}
              </ul>
            ) : null}
            {result.notExecuted.length > 0 ? (
              <ul aria-label="Baris tidak dieksekusi" className="flex flex-col gap-1">
                {result.notExecuted.map((row) => (
                  <li className="text-tp-muted" key={row.rowNumber}>
                    Baris {row.rowNumber} ({row.label}) — tidak dieksekusi.
                  </li>
                ))}
              </ul>
            ) : null}
            {result.failed.length > 0 ? (
              <p className="text-xs text-tp-muted">
                Baris yang berhasil tetap tersimpan; perbaiki baris yang gagal lalu ulangi.
              </p>
            ) : null}
          </div>
        ) : null}
        <InputControl
          error={fileError ?? undefined}
          helper={`${config.helperText} Maksimum ${MASTER_DATA_IMPORT_MAX_ROWS} baris per operasi — berkas dengan baris lebih banyak diproses otomatis per potongan ${MASTER_DATA_IMPORT_MAX_ROWS} baris.`}
          label={`Daftar ${config.label} (berkas Excel)`}
        >
          <div className="mb-2 flex items-center justify-end gap-2">
            <a
              className="shrink-0 text-sm font-medium text-tp-ink-info underline hover:opacity-80"
              download
              href={config.templateUrl}
            >
              Unduh Template
            </a>
          </div>
          <InputDropzone
            accept={{ "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] }}
            ariaLabel={`Unggah berkas Excel ${noun}`}
            disabled={parsing || running}
            hint={
              <>
                Tarik dan letakkan berkas .xlsx di sini, atau{" "}
                <span className="font-medium text-tp-ink-info underline">pilih berkas</span>.
              </>
            }
            onFileSelect={(file) => void acceptFile(file)}
            selectedName={fileName}
          />
        </InputControl>
        {parsing ? <p className="text-sm text-tp-muted">Membaca berkas…</p> : null}
        {running && progress ? (
          <p aria-live="polite" className="text-sm text-tp-muted">
            Mengimpor potongan {progress.current} dari {progress.total}…
          </p>
        ) : null}
        {fileName && parsedRows ? (
          <p aria-live="polite" className="text-sm text-tp-muted">
            {fileName} — {parsedRows.length} baris {noun} terbaca
            {invalidRows.length > 0 ? `, ${invalidRows.length} baris tidak valid` : ""}.
          </p>
        ) : null}
        {invalidRows.length > 0 ? (
          <ul aria-label="Baris tidak valid" className="rounded-lg border border-tp-line">
            {invalidRows.map((row) => (
              <li className="px-3 py-2 text-sm text-red-700" key={row.rowNumber}>
                Baris {row.rowNumber}: {row.reason}.
              </li>
            ))}
          </ul>
        ) : null}
        <div className="flex justify-end gap-2 border-t border-tp-line pt-3">
          <Button disabled={parsing || running} onClick={onClose} type="button" variant="secondary">
            {result ? "Tutup" : "Batal"}
          </Button>
          <Button disabled={parsing || running} type="submit">
            {running ? "Menyimpan…" : isRetry ? `Ulangi ${rowsToSend.length} baris belum berhasil` : "Simpan Massal"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
