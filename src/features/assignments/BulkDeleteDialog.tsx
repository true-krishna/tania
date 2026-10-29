"use client";

import * as React from "react";
import { ApolloError } from "@apollo/client";
import { Button } from "@/components/Button";
import { Modal, ModalActions, ModalContent, ModalTitle } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { errorMessage } from "@/lib/errors";
import type { AssignmentRow } from "./BulkActionBar";
import { BulkResultSummary, type BulkRowResult } from "./BulkResultSummary";
import { rowLabel, useBulkDialogClose, type BulkOutcome } from "./bulkDialog";
import { useBulkDeleteAssignments } from "./useBulkAssignments";

export function BulkDeleteDialog({
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
            <BulkResultSummary
              failed={result.failed}
              labelFor={labelFor}
              succeeded={result.succeeded}
            />
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
