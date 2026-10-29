"use client";

import * as React from "react";

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
