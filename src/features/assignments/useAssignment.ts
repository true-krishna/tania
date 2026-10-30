"use client";

import { useMutation, useQuery } from "@apollo/client";
import {
  AssignmentsDocument,
  UpdateAssignmentDocument,
  type AssignmentsQuery,
} from "@/generated/graphql";
import { toQueryState, type QueryState } from "@/lib/apollo/toQueryState";

type AssignmentNode = AssignmentsQuery["assignments"]["edges"][number]["node"];

/**
 * Single-assignment lookup hook (Chapter) — US2.
 *
 * The served schema exposes `assignments(filter)` (connection) but no
 * `assignment(id)`; the `AssignmentFilter` has no `id` either. Fetch the list
 * and select the matching node.
 */
export function useAssignment(id: string): QueryState<AssignmentNode | undefined> {
  const result = useQuery(AssignmentsDocument, {
    variables: { first: 100 },
    skip: !id,
  });
  const found = result.data?.assignments?.edges.find((edge) => edge.node.id === id)?.node;
  return toQueryState({ ...result, data: found });
}

/**
 * Update hook (Chapter) — US2 / FR-05, gelombang K2 (T001).
 *
 * Backed by the served `updateAssignment(id, input)` mutation (SDL
 * `UpdateAssignmentInput`: projectId/periodStart/periodEnd, semua
 * opsional — talent bukan bagian input sehingga tidak dapat diganti). Backend
 * hanya menerima assignment berstatus ACTIVE (selain itu `PRECONDITION`).
 *
 * Hasil mutasi menuliskan entity `Assignment` terbaru ke cache ternormalisasi,
 * jadi detail dan daftar yang ter-mount otomatis menampilkan versi terbaru
 * tanpa refetch manual (pola yang sama dengan `endAssignment`).
 */
export function useUpdateAssignment() {
  return useMutation(UpdateAssignmentDocument);
}
