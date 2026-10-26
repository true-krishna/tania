"use client";

import * as React from "react";
import { ApolloError } from "@apollo/client";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { InputControl } from "@/components/InputControl";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { errorMessage } from "@/lib/errors";
import { BulkResultSummary, type BulkRowResult } from "./BulkResultSummary";
import { BULK_ASSIGNMENT_MAX_ROWS, useImportAssignments } from "./useBulkAssignments";
import { TEMPLATE_COLUMNS, TEMPLATE_URL, parseTemplate, type ImportTemplateRow } from "./talentTemplate";

type ImportVariables = {
  employeeId: string;
  projectId: string;
  periodStart: string;
  periodEnd?: string;
};

type BulkOutcome = {
  succeeded: readonly BulkRowResult[];
  failed: readonly BulkRowResult[];
};

type BulkCreateAssignmentModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

export function BulkCreateAssignmentModal({
  open,
  onClose,
  onCreated,
}: BulkCreateAssignmentModalProps) {
  const [importAssignments, { loading }] = useImportAssignments();
  const [parsedRows, setParsedRows] = React.useState<ImportTemplateRow[] | null>(null);
  const [invalidRows, setInvalidRows] = React.useState<readonly { rowNumber: number; reason: string }[]>([]);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const [parsing, setParsing] = React.useState(false);
  const [sentRows, setSentRows] = React.useState<readonly ImportTemplateRow[] | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<BulkOutcome | null>(null);
  const { pushToast } = useToast();

  const retryRows = result
    ? result.failed.map((row) => sentRows?.[row.index]).filter((row): row is ImportTemplateRow => !!row)
    : null;
  const rowsToSend = retryRows ?? parsedRows ?? [];
  const isRetry = retryRows !== null;
  const hasRows = rowsToSend.length > 0;

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    setFileError(null);
    setFormError(null);
    setParsedRows(null);
    setInvalidRows([]);
    setFileName(null);
    setResult(null);
    setSentRows(null);
    if (!file) return;
    setParsing(true);
    try {
      const parsed = await parseTemplate(file);
      if (!parsed.ok) {
        setFileError(parsed.reason);
        return;
      }
      if (parsed.rows.length > BULK_ASSIGNMENT_MAX_ROWS) {
        setFileError(
          `Maksimum ${BULK_ASSIGNMENT_MAX_ROWS} baris per operasi massal; berkas berisi ${parsed.rows.length} baris.`,
        );
        return;
      }
      setParsedRows(parsed.rows);
      setInvalidRows(parsed.invalid);
      setFileName(file.name);
    } finally {
      setParsing(false);
    }
  }

  function toVariables(rows: readonly ImportTemplateRow[]): ImportVariables[] {
    return rows.map((row) => ({
      employeeId: row.employeeId,
      projectId: row.projectId,
      periodStart: row.periodStart,
      periodEnd: row.periodEnd || undefined,
    }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!hasRows) {
      setFormError(
        isRetry
          ? "Tidak ada baris gagal untuk diulangi."
          : `Unggah berkas Excel berisi minimal satu baris assignment (kolom ${TEMPLATE_COLUMNS.join(", ")}).`,
      );
      return;
    }
    const submitting = rowsToSend;
    try {
      const payload = await importAssignments({
        variables: { input: { rows: toVariables(submitting) } },
      });
      const bulk = payload.data?.importAssignments;
      if (bulk) {
        setSentRows(submitting);
        setResult({ succeeded: bulk.succeeded, failed: bulk.failed });
        if (bulk.failed.length === 0) {
          pushToast("success", `${bulk.succeeded.length} assignment berhasil dibuat massal.`);
          onCreated?.();
          onClose();
        } else {
          onCreated?.();
        }
      }
    } catch (err) {
      setFormError(
        errorMessage(err instanceof ApolloError ? err : null, "Gagal mengimpor assignment massal."),
      );
    }
  }

  function labelFor(row: BulkRowResult): string {
    const name = row.assignment?.talent?.fullName;
    if (name) return name;
    if (row.employeeId) return row.employeeId;
    return `Baris ${(sentRows?.[row.index]?.rowNumber ?? row.index + 2)}`;
  }

  return (
    <Modal onClose={onClose} open={open} size="md" title="Buat Assignment Massal">
      <form aria-label="Buat Assignment Massal" className="flex flex-col gap-4" onSubmit={onSubmit}>
        {formError ? (
          <p className="text-sm text-red-700" role="alert">
            {formError}
          </p>
        ) : null}
        {result ? (
          <BulkResultSummary failed={result.failed} labelFor={labelFor} succeeded={result.succeeded} />
        ) : null}
        <InputControl
          error={fileError ?? undefined}
          helper={`Unduh template, isi employee_id (nomor induk atau ID talent), project_id (nama project aktif atau ID), period_start; period_end opsional (kosong = berjalan). Maksimum ${BULK_ASSIGNMENT_MAX_ROWS} baris.`}
          label="Daftar Assignment (berkas Excel)"
        >
          <div className="flex items-center gap-2">
            <Input
              accept=".xlsx"
              aria-label="Unggah berkas Excel assignment"
              disabled={parsing}
              onChange={onFileChange}
              type="file"
            />
            <a
              className="shrink-0 text-sm font-medium text-tp-ink-info underline hover:opacity-80"
              download
              href={TEMPLATE_URL}
            >
              Unduh Template
            </a>
          </div>
        </InputControl>
        {parsing ? <p className="text-sm text-tp-muted">Membaca berkas…</p> : null}
        {fileName && parsedRows ? (
          <p aria-live="polite" className="text-sm text-tp-muted">
            {fileName} — {parsedRows.length} baris assignment terbaca
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
          <Button disabled={loading || parsing} onClick={onClose} type="button" variant="secondary">
            {result ? "Tutup" : "Batal"}
          </Button>
          <Button disabled={loading || parsing} type="submit">
            {loading
              ? "Menyimpan…"
              : isRetry
                ? `Ulangi ${rowsToSend.length} baris gagal`
                : "Simpan Massal"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
