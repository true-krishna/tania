"use client";

import * as React from "react";
import { useActivitiesStore } from "./ActivitiesProvider";
import type { ActivityInput, PersonalWorkActivity } from "./types";

export interface UpdateActivityState {
  update: (id: string, input: ActivityInput) => Promise<PersonalWorkActivity | null>;
  loading: boolean;
  error: string | null;
}

/** Update mutation. On failure it returns `null` and exposes the message. */
export function useUpdateActivity(): UpdateActivityState {
  const { update } = useActivitiesStore();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const run = React.useCallback(
    async (id: string, input: ActivityInput) => {
      setLoading(true);
      setError(null);
      try {
        return await update(id, input);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Gagal memperbarui aktivitas.");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [update],
  );

  return { update: run, loading, error };
}
