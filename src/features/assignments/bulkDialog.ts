"use client";

import * as React from "react";
import type { BulkRowResult } from "./BulkResultSummary";

export type EditFieldErrors = Partial<Record<"changes" | "periodEnd", string>>;

export type BulkOutcome = {
  succeeded: readonly BulkRowResult[];
  failed: readonly BulkRowResult[];
};

export type BulkRow = {
  id: string;
  talent: { fullName: string };
  project: { name: string };
};

export function rowLabel(row: BulkRow): string {
  return `${row.talent.fullName} → ${row.project.name}`;
}

export function useBulkDialogClose(onClose: () => void, onClear: () => void) {
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
