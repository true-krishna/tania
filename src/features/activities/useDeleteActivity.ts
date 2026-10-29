"use client";

import * as React from "react";
import { useActivitiesStore } from "./ActivitiesProvider";
import { errorText } from "@/lib/errors";

export interface DeleteActivityState {
  remove: (id: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

/** Delete mutation. Resolves `true` on success, `false` and sets `error` otherwise. */
export function useDeleteActivity(): DeleteActivityState {
  const { remove } = useActivitiesStore();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const run = React.useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        await remove(id);
        return true;
      } catch (cause) {
        setError(errorText(cause, "Gagal menghapus aktivitas."));
        return false;
      } finally {
        setLoading(false);
      }
    },
    [remove],
  );

  return { remove: run, loading, error };
}
