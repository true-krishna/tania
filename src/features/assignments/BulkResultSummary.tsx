"use client";

import * as React from "react";
import type { BulkAssignmentErrorCode } from "@/generated/graphql/types";
import { BULK_ASSIGNMENT_ERROR_LABEL } from "@/lib/errors";

export type BulkRowResult = {
  index: number;
  employeeId?: string | null;
  assignmentId?: string | null;
  error?: { code: BulkAssignmentErrorCode; message: string } | null;
};

type BulkResultSummaryProps = {
  succeeded: readonly BulkRowResult[];
  failed: readonly BulkRowResult[];
  labelFor: (row: BulkRowResult) => string;
};

function failureMessage(row: BulkRowResult): string {
  if (row.error?.message) return row.error.message;
  if (row.error) return BULK_ASSIGNMENT_ERROR_LABEL[row.error.code];
  return "Baris gagal diproses.";
}

export function BulkResultSummary({ succeeded, failed, labelFor }: BulkResultSummaryProps) {
  if (succeeded.length === 0 && failed.length === 0) return null;
  return (
    <div
      className="flex flex-col gap-2 rounded-lg border border-tp-line bg-tp-bg px-3 py-2 text-sm"
      role="status"
    >
      <p className="font-medium text-tp-text">
        {failed.length === 0
          ? `${succeeded.length} baris berhasil.`
          : `${succeeded.length} berhasil, ${failed.length} gagal.`}
      </p>
      {failed.length > 0 ? (
        <>
          <ul className="flex flex-col gap-1">
            {failed.map((row) => (
              <li className="text-red-700" key={row.index}>
                <span className="font-medium">{labelFor(row)}</span>
                {" — "}
                {failureMessage(row)}
              </li>
            ))}
          </ul>
          <p className="text-xs text-tp-muted">
            Baris yang berhasil tetap tersimpan; perbaiki baris yang gagal lalu ulangi.
          </p>
        </>
      ) : null}
    </div>
  );
}
