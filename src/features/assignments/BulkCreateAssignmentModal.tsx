"use client";

import { IconX } from "@tabler/icons-react";
import * as React from "react";
import { ApolloError } from "@apollo/client";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { Input } from "@/components/Input";
import { InputControl } from "@/components/InputControl";
import { Modal } from "@/components/Modal";
import { Select } from "@/components/Select";
import { useToast } from "@/components/Toast";
import { useAssignableTalents } from "@/features/employees/useEmployees";
import { useProjects } from "@/features/master-data/useMasterData";
import { errorMessage } from "@/lib/errors";
import { cn } from "@/lib/cn";
import { BulkResultSummary, type BulkRowResult } from "./BulkResultSummary";
import { BULK_ASSIGNMENT_MAX_ROWS, useBulkCreateAssignments } from "./useBulkAssignments";

type TalentOption = { id: string; fullName: string; nomorInduk: string | null };

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

function matchesSearch(talent: TalentOption, search: string): boolean {
  const needle = search.trim().toLowerCase();
  if (!needle) return true;
  return (
    talent.fullName.toLowerCase().includes(needle) ||
    (talent.nomorInduk ?? "").toLowerCase().includes(needle)
  );
}

export function BulkCreateAssignmentModal({
  open,
  onClose,
  onCreated,
}: BulkCreateAssignmentModalProps) {
  const projects = useProjects();
  const talents = useAssignableTalents();
  const [bulkCreate, { loading }] = useBulkCreateAssignments();
  const [selected, setSelected] = React.useState<TalentOption[]>([]);
  const [search, setSearch] = React.useState("");
  const [projectId, setProjectId] = React.useState("");
  const [periodStart, setPeriodStart] = React.useState("");
  const [periodEnd, setPeriodEnd] = React.useState("");
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<BulkOutcome | null>(null);
  const { pushToast } = useToast();

  const candidates = (talents.data ?? []).filter((talent) => matchesSearch(talent, search));
  const selectedIds = new Set(selected.map((talent) => talent.id));
  const retryIds = result ? result.failed.map((row) => row.employeeId).filter((id): id is string => !!id) : null;
  const idsToSend = retryIds ?? selected.map((talent) => talent.id);
  const isRetry = retryIds !== null;

  function toggleTalent(talent: TalentOption) {
    setFormError(null);
    setErrors((e) => ({ ...e, employees: undefined }));
    setSelected((prev) => {
      if (prev.some((t) => t.id === talent.id)) {
        return prev.filter((t) => t.id !== talent.id);
      }
      if (prev.length >= BULK_ASSIGNMENT_MAX_ROWS) {
        setErrors((e) => ({
          ...e,
          employees: `Maksimum ${BULK_ASSIGNMENT_MAX_ROWS} talent per operasi massal.`,
        }));
        return prev;
      }
      return [...prev, talent];
    });
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (idsToSend.length === 0) {
      next.employees = isRetry ? "Tidak ada baris gagal untuk diulangi." : "Pilih minimal satu talent.";
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
    const talent = selected.find((t) => t.id === row.employeeId);
    return talent?.fullName ?? `Talent ${row.employeeId ?? `#${row.index}`}`;
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
            <div className="flex flex-col gap-1">
              <InputControl error={errors.employees} label={`Talent (${selected.length} dipilih)`}>
                <Input
                  aria-label="Cari talent"
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama atau nomor induk…"
                  type="search"
                  value={search}
                />
              </InputControl>
              {selected.length > 0 ? (
                <ul aria-label="Talent terpilih" className="flex flex-wrap gap-1.5">
                  {selected.map((talent) => (
                    <Chip key={talent.id} size="small" variant="info">
                      {talent.fullName}
                      <button
                        aria-label={`Hapus ${talent.fullName} dari pilihan`}
                        className="ml-0.5 rounded-full hover:opacity-70"
                        onClick={() => toggleTalent(talent)}
                        type="button"
                      >
                        <IconX aria-hidden size={12} stroke={2} />
                      </button>
                    </Chip>
                  ))}
                </ul>
              ) : null}
              <ul
                aria-label="Kandidat talent"
                className="max-h-44 divide-y divide-tp-line overflow-y-auto rounded-lg border border-tp-line"
              >
                {candidates.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-tp-muted">Tidak ada talent yang cocok.</li>
                ) : (
                  candidates.map((talent) => {
                    const isSelected = selectedIds.has(talent.id);
                    return (
                      <li key={talent.id}>
                        <button
                          aria-label={`${talent.fullName} ${talent.nomorInduk ?? ""}`.trim()}
                          aria-pressed={isSelected}
                          className={cn(
                            "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-tp-bg",
                            isSelected && "font-medium",
                          )}
                          onClick={() => toggleTalent(talent)}
                          type="button"
                        >
                          <span>
                            {talent.fullName}
                            <span className="ml-2 text-xs text-tp-muted">
                              {` ${talent.nomorInduk ?? "—"}`}
                            </span>
                          </span>
                          {isSelected ? <span className="text-xs text-tp-ink-info">dipilih</span> : null}
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
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
          <Button disabled={loading || loadingData || !!dataError} type="submit">
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
