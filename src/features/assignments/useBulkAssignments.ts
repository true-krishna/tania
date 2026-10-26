"use client";

import { useMutation } from "@apollo/client";
import {
  BulkCreateAssignmentsDocument,
  BulkDeleteAssignmentsDocument,
  BulkUpdateAssignmentsDocument,
} from "@/generated/graphql";

/**
 * Batas baris per operasi massal (FR-07). Server tetap penegak akhir; guard
 * klien ini hanya mencegah pengiriman yang pasti ditolak utuh.
 */
export const BULK_ASSIGNMENT_MAX_ROWS = 100;

/**
 * Mutasi massal assignment (TAN-337, gelombang K2) — kontrak SDL dibekukan di
 * `specs/007-bulk-talent-assignment/plan.md`. Ketiganya mengembalikan hasil
 * per baris (`succeeded`/`failed` dengan alasan), bukan all-or-nothing, jadi
 * kegagalan satu baris tidak menggulung baris lain (FR-02).
 *
 * `refetchQueries: ["Assignments"]` menyegarkan daftar (termasuk riwayat per
 * talent dan daftar per project yang memakai query yang sama) setelah batch
 * selesai — baris hasil massal tidak cukup ditulis satu per satu ke cache
 * ternormalisasi seperti mutasi tunggal.
 */
export function useBulkCreateAssignments() {
  return useMutation(BulkCreateAssignmentsDocument, { refetchQueries: ["Assignments"] });
}

export function useBulkUpdateAssignments() {
  return useMutation(BulkUpdateAssignmentsDocument, { refetchQueries: ["Assignments"] });
}

export function useBulkDeleteAssignments() {
  return useMutation(BulkDeleteAssignmentsDocument, { refetchQueries: ["Assignments"] });
}
