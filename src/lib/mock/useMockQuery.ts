"use client";

import * as React from "react";

export type MockQueryState<T> = {
  status: "loading" | "ready" | "error";
  data: T | undefined;
  error: string | null;
};

/**
 * Small mock query helper used while the backend waves are not yet served.
 *
 * This is the seam for the "mock dulu, integrasi kemudian" sign-off: every
 * feature hook (`src/features/<modul>/useX.ts`) returns data typed exactly like
 * the contract-generated types, but sourced from static datasets while the
 * backend operation does not exist yet. To move a feature onto the live API,
 * replace the feature hook's body with the real Apollo `useQuery` — the
 * components do not need to change.
 *
 * `deps` drives re-run of `loader` (like a GraphQL `useQuery(variables)`), so
 * mock filters/interactions re-fetch the same way a live query would. The first
 * render reports `loading`; later runs swap the resolved data once the latency
 * elapses.
 */
export function useMockQuery<T>(loader: () => T, deps: unknown[] = [], latencyMs = 200) {
  const [state, setState] = React.useState<MockQueryState<T>>(() => ({
    status: "loading",
    data: undefined,
    error: null,
  }));

  React.useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      if (!alive) return;
      try {
        setState({ status: "ready", data: loader(), error: null });
      } catch (err) {
        setState({
          status: "error",
          data: undefined,
          error: err instanceof Error ? err.message : "Something went wrong.",
        });
      }
    }, latencyMs);
    return () => {
      alive = false;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}