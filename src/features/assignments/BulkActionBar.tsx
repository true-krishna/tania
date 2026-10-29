"use client";

import * as React from "react";
import { Button } from "@/components/Button";
import type { AssignmentStatus } from "@/generated/graphql/types";
import { BulkDeleteDialog } from "./BulkDeleteDialog";
import { BulkEditModal } from "./BulkEditModal";

export type AssignmentRow = {
  id: string;
  status: AssignmentStatus;
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
            {skipped} baris berstatus selesai dilewati — hanya assignment berjalan yang dapat diubah
            atau dihapus massal.
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
