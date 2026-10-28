"use client";

import * as React from "react";
import { ApolloError } from "@apollo/client";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { InputControl } from "@/components/InputControl";
import { Modal, ModalActions, ModalContent, ModalTitle } from "@/components/Modal";
import { Select } from "@/components/Select";
import { useToast } from "@/components/Toast";
import { useProjects } from "@/features/master-data/useMasterData";
import { errorMessage } from "@/lib/errors";
import { BulkResultSummary, type BulkRowResult } from "./BulkResultSummary";
import { useBulkDeleteAssignments, useBulkUpdateAssignments } from "./useBulkAssignments";

export type AssignmentRow = {
  id: string;
  status: string;
  talent: { id: string; fullName: string; nomorInduk: string | null };
  project: { id: string; name: string };
  periodStart: string;
  periodEnd: string | null;
};

type BulkActionBarProps = {
  rows: readonly AssignmentRow[];
  onClear: () => void;
  onDone: () => void;
};

type EditFieldErrors = Partial<Record<"changes" | "periodEnd", string>>;

type BulkOutcome = {
  succeeded: readonly BulkRowResult[];
  failed: readonly BulkRowResult[];
};

function rowLabel(row: AssignmentRow): string {
  return `${row.talent.fullName} → ${row.project.name}`;
}

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

export function BulkActionBar({ rows, onClear, onDone }: BulkActionBarProps) {
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const eligible = rows.filter((row) => row.status === "ACTIVE");
  const skipped = rows.length - eligible.length;

  return (
    <>
      <div
        aria-label="Aksi massal assignment"
        className="flex flex-wrap items-center gap-2 rounded-lg border border-tp-line bg-tp-bg px-3 py-2"
        role="toolbar"
      >
        <span className="text-sm font-medium text-tp-text">{rows.length} dipilih</span>
        {skipped > 0 ? (
          <span className="text-xs text-tp-muted">
            {skipped} baris berstatus selesai dilewati — hanya assignment berjalan yang dapat
            diubah atau dihapus massal.
          </span>
        ) : null}
        <span className="flex-1" />
        <Button
          disabled={eligible.length === 0}
          onClick={() => setEditOpen(true)}
          type="button"
          variant="secondary"
        >
          Ubah massal
        </Button>
        <Button
          disabled={eligible.length === 0}
          onClick={() => setDeleteOpen(true)}
          type="button"
          variant="secondary"
        >
          Hapus massal
        </Button>
        <Button onClick={onClear} type="button" variant="ghost">
          Bersihkan
        </Button>
      </div>
      <BulkEditModal
        eligible={eligible}
        onClear={onClear}
        onClose={() => setEditOpen(false)}
        onDone={onDone}
        open={editOpen}
      />
      <BulkDeleteDialog
        eligible={eligible}
        onClear={onClear}
        onClose={() => setDeleteOpen(false)}
        onDone={onDone}
        open={deleteOpen}
      />
    </>
  );
}

function BulkEditModal({
  eligible,
  onClose,
  onClear,
  onDone,
  open,
}: {
  eligible: readonly AssignmentRow[];
  onClose: () => void;
  onClear: () => void;
  onDone: () => void;
  open: boolean;
}) {
  const projects = useProjects({ skip: !open });
  const [bulkUpdate, { loading }] = useBulkUpdateAssignments();
  const [projectId, setProjectId] = React.useState("");
  const [periodStart, setPeriodStart] = React.useState("");
  const [periodEnd, setPeriodEnd] = React.useState("");
  const [errors, setErrors] = React.useState<EditFieldErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<BulkOutcome | null>(null);
  const [wasOpen, setWasOpen] = React.useState(open);
  const { pushToast } = useToast();
  const { markAttempted, handleClose } = useBulkDialogClose(onClose, onClear);
  const formId = React.useId();

  if (open && !wasOpen) {
    setWasOpen(true);
    setProjectId("");
    setPeriodStart("");
    setPeriodEnd("");
    setErrors({});
    setFormError(null);
    setResult(null);
  }
  if (!open && wasOpen) {
    setWasOpen(false);
  }

  const retryIds = result
    ? result.failed.map((row) => row.assignmentId).filter((id): id is string => !!id)
    : null;
  const idsToSend = retryIds ?? eligible.map((row) => row.id);
  const isRetry = retryIds !== null;

  function validate(): EditFieldErrors {
    const next: EditFieldErrors = {};
    if (!projectId && !periodStart && !periodEnd) {
      next.changes = "Isi minimal satu perubahan (project atau periode).";
    }
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
      const payload = await bulkUpdate({
        variables: {
          input: {
            ids: idsToSend,
            projectId: projectId || undefined,
            periodStart: periodStart || undefined,
            periodEnd: periodEnd || undefined,
          },
        },
      });
      const bulk = payload.data?.bulkUpdateAssignments;
      if (bulk) {
        setResult({ succeeded: bulk.succeeded, failed: bulk.failed });
        markAttempted();
        onDone();
        if (bulk.failed.length === 0) {
          pushToast("success", `${bulk.succeeded.length} assignment berhasil diubah massal.`);
          handleClose();
        }
      }
    } catch (err) {
      setFormError(
        errorMessage(err instanceof ApolloError ? err : null, "Gagal mengubah assignment massal."),
      );
    }
  }

  function labelFor(row: BulkRowResult): string {
    const found = eligible.find((r) => r.id === row.assignmentId);
    return found ? rowLabel(found) : `Assignment ${row.assignmentId ?? `#${row.index}`}`;
  }

  return (
    <Modal onClose={handleClose} open={open} size="md">
      <ModalTitle>Ubah Assignment Massal</ModalTitle>
      <ModalContent>
        <form
          aria-label="Ubah Assignment Massal"
          className="flex flex-col gap-4"
          id={formId}
          onSubmit={onSubmit}
        >
          {formError || errors.changes ? (
            <p className="text-sm text-red-700" role="alert">
              {formError ?? errors.changes}
            </p>
          ) : null}
          {result ? (
            <BulkResultSummary failed={result.failed} labelFor={labelFor} succeeded={result.succeeded} />
          ) : null}
          <p className="text-sm text-tp-muted">
            Perubahan yang sama diterapkan ke {idsToSend.length} assignment berjalan. Talent tidak
            berganti; pengakhiran tetap melalui alur akhiri assignment.
          </p>
          <InputControl label="Project baru">
            <Select
              onChange={(e) => setProjectId(e.target.value)}
              options={[
                { value: "", label: "— tidak diubah —" },
                ...(projects.data ?? [])
                  .filter((p) => p.isActive)
                  .map((p) => ({ value: p.id, label: p.name })),
              ]}
              value={projectId}
            />
          </InputControl>
          <InputControl label="Tanggal mulai baru">
            <Input onChange={(e) => setPeriodStart(e.target.value)} type="date" value={periodStart} />
          </InputControl>
          <InputControl
            error={errors.periodEnd}
            helper="(tidak mengosongkan tanggal selesai yang sudah terisi)"
            label="Tanggal selesai baru"
          >
            <Input onChange={(e) => setPeriodEnd(e.target.value)} type="date" value={periodEnd} />
          </InputControl>
        </form>
      </ModalContent>
      <ModalActions>
        <Button disabled={loading} onClick={handleClose} type="button" variant="secondary">
          {result ? "Tutup" : "Batal"}
        </Button>
        <Button disabled={loading} form={formId} type="submit">
          {loading
            ? "Menyimpan…"
            : isRetry
              ? `Ulangi ${idsToSend.length} baris gagal`
              : `Terapkan ke ${idsToSend.length} assignment`}
        </Button>
      </ModalActions>
    </Modal>
  );
}

function BulkDeleteDialog({
  eligible,
  onClose,
  onClear,
  onDone,
  open,
}: {
  eligible: readonly AssignmentRow[];
  onClose: () => void;
  onClear: () => void;
  onDone: () => void;
  open: boolean;
}) {
  const [bulkDelete, { loading }] = useBulkDeleteAssignments();
  const [result, setResult] = React.useState<BulkOutcome | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [wasOpen, setWasOpen] = React.useState(open);
  const { pushToast } = useToast();
  const { markAttempted, handleClose } = useBulkDialogClose(onClose, onClear);

  if (open && !wasOpen) {
    setWasOpen(true);
    setResult(null);
    setFormError(null);
  }
  if (!open && wasOpen) {
    setWasOpen(false);
  }

  function labelFor(row: BulkRowResult): string {
    const found = eligible.find((r) => r.id === row.assignmentId);
    return found ? rowLabel(found) : `Assignment ${row.assignmentId ?? `#${row.index}`}`;
  }

  async function onConfirm() {
    setFormError(null);
    try {
      const payload = await bulkDelete({
        variables: { ids: eligible.map((row) => row.id) },
      });
      const bulk = payload.data?.bulkDeleteAssignments;
      if (bulk) {
        setResult({ succeeded: bulk.succeeded, failed: bulk.failed });
        markAttempted();
        onDone();
        if (bulk.failed.length === 0) {
          pushToast("success", `${bulk.succeeded.length} assignment terhapus.`);
          handleClose();
        }
      }
    } catch (err) {
      setFormError(
        errorMessage(err instanceof ApolloError ? err : null, "Gagal menghapus assignment massal."),
      );
    }
  }

  return (
    <Modal onClose={handleClose} open={open} size="md">
      <ModalTitle>Hapus Assignment Massal</ModalTitle>
      <ModalContent>
        <div className="flex flex-col gap-4">
          {formError ? (
            <p className="text-sm text-red-700" role="alert">
              {formError}
            </p>
          ) : null}
          {result ? (
            <BulkResultSummary failed={result.failed} labelFor={labelFor} succeeded={result.succeeded} />
          ) : (
            <>
              <p className="text-sm text-tp-text">
                Hapus {eligible.length} assignment berjalan yang dipilih? Tindakan ini tidak dapat
                dibatalkan.
              </p>
              <ul className="flex flex-col gap-1 text-sm text-tp-muted">
                {eligible.map((row) => (
                  <li key={row.id}>{rowLabel(row)}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      </ModalContent>
      <ModalActions>
        {result ? (
          <Button onClick={handleClose} type="button" variant="secondary">
            Tutup
          </Button>
        ) : (
          <>
            <Button disabled={loading} onClick={handleClose} type="button" variant="secondary">
              Batal
            </Button>
            <Button disabled={loading} onClick={onConfirm} type="button">
              {loading ? "Menghapus…" : `Hapus ${eligible.length} assignment`}
            </Button>
          </>
        )}
      </ModalActions>
    </Modal>
  );
}
