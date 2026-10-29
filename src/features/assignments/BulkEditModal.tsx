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
import type { AssignmentRow } from "./BulkActionBar";
import { BulkResultSummary, type BulkRowResult } from "./BulkResultSummary";
import { rowLabel, useBulkDialogClose, type BulkOutcome, type EditFieldErrors } from "./bulkDialog";
import { useBulkUpdateAssignments } from "./useBulkAssignments";

function saveLabel(loading: boolean, isRetry: boolean, count: number): string {
  if (loading) return "Menyimpan…";
  if (isRetry) return `Ulangi ${count} baris gagal`;
  return `Terapkan ke ${count} assignment`;
}

export function BulkEditModal({
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
            <BulkResultSummary
              failed={result.failed}
              labelFor={labelFor}
              succeeded={result.succeeded}
            />
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
            <Input
              onChange={(e) => setPeriodStart(e.target.value)}
              type="date"
              value={periodStart}
            />
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
          {saveLabel(loading, isRetry, idsToSend.length)}
        </Button>
      </ModalActions>
    </Modal>
  );
}
