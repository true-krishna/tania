"use client";

import * as React from "react";
import { getPeriodFixture } from "./mocks";
import type { PeriodFixture } from "./types";

export type WorkloadFixtureState =
  | { status: "loading" }
  | { status: "ready"; fixture: PeriodFixture }
  | { status: "error" };

/**
 * Loads the fixture for a period. WAD latency is simulated so the loading state
 * (design §5.7) is reachable in the mock-data slice; the GraphQL version of
 * this hook keeps the same `status` contract.
 *
 * `reloadKey` re-runs the load — wired to the `Coba lagi` action on the
 * unavailable / hard-error states.
 */
export function useWorkloadFixture(periodId: string, reloadKey = 0): WorkloadFixtureState {
  const [state, setState] = React.useState<WorkloadFixtureState>({ status: "loading" });

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate: entering the loading state is the point of a refetch
    setState({ status: "loading" });
    const timer = setTimeout(() => {
      const fixture = getPeriodFixture(periodId);
      setState(fixture ? { status: "ready", fixture } : { status: "error" });
    }, 350);

    return () => clearTimeout(timer);
  }, [periodId, reloadKey]);

  return state;
}
