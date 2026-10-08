"use client";

import * as React from "react";
import { useActivitiesStore } from "./ActivitiesProvider";
import type { ActivityInput, PersonalWorkActivity } from "./types";

export interface CreateActivityState {
  create: (input: ActivityInput) => Promise<PersonalWorkActivity | null>;
  loading: boolean;
  error: string | null;
}

/** Create mutation. On failure it returns `null` and exposes the message. */
export function useCreateActivity(): CreateActivityState {
  const { create } = useActivitiesStore();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const run = React.useCallback(
    async (input: ActivityInput) => {
      setLoading(true);
      setError(null);
      try {
        return await create(input);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Gagal menyimpan aktivitas.");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [create],
  );

  return { create: run, loading, error };
}
