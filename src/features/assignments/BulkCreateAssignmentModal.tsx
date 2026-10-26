"use client";

import * as React from "react";
import { ApolloError } from "@apollo/client";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { InputControl } from "@/components/InputControl";
import { Modal } from "@/components/Modal";
import { Select } from "@/components/Select";
import { useToast } from "@/components/Toast";
import { useAssignableTalents } from "@/features/employees/useEmployees";
import { useProjects } from "@/features/master-data/useMasterData";
import { errorMessage } from "@/lib/errors";
import { BulkResultSummary, type BulkRowResult } from "./BulkResultSummary";
import { BULK_ASSIGNMENT_MAX_ROWS, useBulkCreateAssignments } from "./useBulkAssignments";
import { TEMPLATE_COLUMN, TEMPLATE_URL, mapTemplateRows, parseTalentTemplate, type TalentTemplateRow } from "./talentTemplate";

type FieldErrors = Partial<Record<"employees" | "projectId" | "periodStart" | "periodEnd", string>>;

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
  const projects = useProjects();
  const talents = useAssignableTalents();
  const [bulkCreate, { loading }] = useBulkCreateAssignments();
  const [rows, setRows] = React.useState<TalentTemplateRow[] | null>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const [parsing, setParsing] = React.useState(false);
  const [projectId, setProjectId] = React.useState("");
  const [periodStart, setPeriodStart] = React.useState("");
  const [periodEnd, setPeriodEnd] = React.useState("");
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<BulkOutcome | null>(null);
  const { pushToast } = useToast();

  const mappedRows = (rows ?? []).filter((row): row is TalentTemplateRow & { talent: NonNullable<TalentTemplateRow["talent"]> } => !!row.talent);
  const unmappedRows = (rows ?? []).filter((row) => !row.talent);
  const retryIds = result ? result.failed.map((row) => row.employeeId).filter((id): id is string => !!id) : null;
  const idsToSend = retryIds ?? mappedRows.map((row) => row.talent.id);
  const isRetry = retryIds !== null;
  const talentLabel = new Map(mappedRows.map((row) => [row.talent.id, row.talent.fullName]));

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    setFileError(null);
    setFormError(null);
    setErrors((prev) => ({ ...prev, employees: undefined }));
    setRows(null);
    setFileName(null);
    if (!file) return;
    setParsing(true);
    try {
      const parsed = await parseTalentTemplate(file);
      if (!parsed.ok) {
        setFileError(parsed.reason);
        return;
      }
      if (parsed.nomorInduk.length > BULK_ASSIGNMENT_MAX_ROWS) {
        setFileError(
          `Maksimum ${BULK_ASSIGNMENT_MAX_ROWS} talent per operasi massal; berkas berisi ${parsed.nomorInduk.length} baris.`,
        );
        return;
      }
      setRows(mapTemplateRows(parsed.nomorInduk, talents.data ?? []));
      setFileName(file.name);
    } finally {
      setParsing(false);
    }
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (idsToSend.length === 0) {
      next.employees = isRetry
        ? "Tidak ada baris gagal untuk diulangi."
        : `Unggah berkas Excel berisi minimal satu talent (kolom ${TEMPLATE_COLUMN}).`;
    }
    if (!projectId) next.projectId = "Project wajib dipilih.";
    if (!periodStart) next.periodStart = "Tanggal mulai wajib diisi.";
    if (periodEnd && periodStart && periodEnd < periodStart) {
      next.periodEnd = "Tanggal selesai tidak boleh lebih awal dari tanggal mulai.";
    }
    return next;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    try {
      const payload = await bulkCreate({
        variables: {
          input: {
            employeeIds: idsToSend,
            projectId,
            periodStart,
            periodEnd: periodEnd || undefined,
          },
        },
      });
      const bulk = payload.data?.bulkCreateAssignments;
      if (bulk) {
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
        errorMessage(err instanceof ApolloError ? err : null, "Gagal membuat assignment massal."),
      );
    }
  }

  function labelFor(row: BulkRowResult): string {
    const name = row.employeeId ? talentLabel.get(row.employeeId) : undefined;
    return name ?? `Talent ${row.employeeId ?? `#${row.index}`}`;
  }

  const loadingData = projects.status === "loading" || talents.status === "loading";
  const dataError =
    projects.status === "error"
      ? projects.error ?? "Gagal memuat project."
      : talents.status === "error"
        ? talents.error ?? "Gagal memuat talent."
        : null;

  return (
    <Modal onClose={onClose} open={open} size="md" title="Buat Assignment Massal">
      <form aria-label="Buat Assignment Massal" className="flex flex-col gap-4" onSubmit={onSubmit}>
        {loadingData ? (
          <p className="text-sm text-tp-muted">Memuat data…</p>
        ) : dataError ? (
          <p className="text-sm text-red-700" role="alert">
            {dataError}
          </p>
        ) : (
          <>
            {formError ? (
              <p className="text-sm text-red-700" role="alert">
                {formError}
              </p>
            ) : null}
            {result ? (
              <BulkResultSummary failed={result.failed} labelFor={labelFor} succeeded={result.succeeded} />
            ) : null}
            <InputControl
              error={errors.employees ?? fileError ?? undefined}
              helper={`Unduh template, isi kolom ${TEMPLATE_COLUMN}, lalu unggah kembali (maksimum ${BULK_ASSIGNMENT_MAX_ROWS} baris).`}
              label="Daftar Talent (berkas Excel)"
            >
              <div className="flex items-center gap-2">
                <Input
                  accept=".xlsx"
                  aria-label="Unggah berkas Excel talent"
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
            {fileName && rows ? (
              <p aria-live="polite" className="text-sm text-tp-muted">
                {fileName} — {mappedRows.length} talent terbaca
                {unmappedRows.length > 0 ? `, ${unmappedRows.length} tidak dikenal` : ""}.
              </p>
            ) : null}
            {unmappedRows.length > 0 ? (
              <ul aria-label="Baris tidak dikenal" className="rounded-lg border border-tp-line">
                {unmappedRows.map((row) => (
                  <li className="px-3 py-2 text-sm text-red-700" key={row.rowNumber}>
                    Baris {row.rowNumber}: {row.nomorInduk} — nomor induk tidak ditemukan di antara
                    kandidat talent assignable.
                  </li>
                ))}
              </ul>
            ) : null}
            <InputControl error={errors.projectId} label="Project">
              <Select
                onChange={(e) => {
                  setProjectId(e.target.value);
                  setErrors((prev) => ({ ...prev, projectId: undefined }));
                }}
                options={[
                  { value: "", label: "— pilih project —" },
                  ...(projects.data ?? [])
                    .filter((p) => p.isActive)
                    .map((p) => ({ value: p.id, label: p.name })),
                ]}
                value={projectId}
              />
            </InputControl>
            <InputControl error={errors.periodStart} label="Tanggal Mulai">
              <Input
                onChange={(e) => {
                  setPeriodStart(e.target.value);
                  setErrors((prev) => ({ ...prev, periodStart: undefined }));
                }}
                type="date"
                value={periodStart}
              />
            </InputControl>
            <InputControl
              error={errors.periodEnd}
              helper="(opsional, kosong = aktif)"
              label="Tanggal Selesai"
            >
              <Input
                onChange={(e) => {
                  setPeriodEnd(e.target.value);
                  setErrors((prev) => ({ ...prev, periodEnd: undefined }));
                }}
                type="date"
                value={periodEnd}
              />
            </InputControl>
          </>
        )}
        <div className="flex justify-end gap-2 border-t border-tp-line pt-3">
          <Button disabled={loading || loadingData} onClick={onClose} type="button" variant="secondary">
            {result ? "Tutup" : "Batal"}
          </Button>
          <Button disabled={loading || parsing || loadingData || !!dataError} type="submit">
            {loading
              ? "Menyimpan…"
              : isRetry
                ? `Ulangi ${idsToSend.length} baris gagal`
                : "Simpan Massal"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}