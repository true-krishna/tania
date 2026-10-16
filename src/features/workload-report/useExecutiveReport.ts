"use client";

import * as React from "react";
import { getExecutiveFixture } from "./mocks";
import type { ExecutiveReportFixture } from "./types";

export type ExecutiveReportState =
  | { status: "loading" }
  | { status: "ready"; fixture: ExecutiveReportFixture }
  | { status: "error" };

/**
 * Loads the executive fixture for a period. WAD latency is simulated so every
 * loading panel is reachable in the mock-data slice; the GraphQL version keeps
 * the same `status` contract. `reloadKey` re-runs the load — wired to
 * `Coba lagi` on the unavailable state.
 */
export function useExecutiveReport(period: string, reloadKey = 0): ExecutiveReportState {
  const [state, setState] = React.useState<ExecutiveReportState>({ status: "loading" });

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate: entering the loading state is the point of a refetch
    setState({ status: "loading" });
    const timer = setTimeout(() => {
      const fixture = getExecutiveFixture(period);
      setState(fixture ? { status: "ready", fixture } : { status: "error" });
    }, 350);

    return () => clearTimeout(timer);
  }, [period, reloadKey]);

  return state;
}
