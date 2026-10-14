"use client";

import * as React from "react";
import {
  DEFAULT_PERIOD_ID,
  WorkloadErrorState,
  WorkloadFreshnessNotice,
  WorkloadOwnView,
  WorkloadReflectionNotice,
  WorkloadSkeleton,
  useWorkloadFixture,
} from "@/features/workload";

/**
 * Workload section of `/profile` (TAN-188) — the same "Workload saya" view as
 * `/workload`'s own tab, pinned to the current period (no selector here).
 * Still fixture-driven behind the same hook the workload page uses.
 */
export function WorkloadSection() {
  const [reloadKey, setReloadKey] = React.useState(0);
  const retry = React.useCallback(() => setReloadKey((k) => k + 1), []);

  const fixtureState = useWorkloadFixture(DEFAULT_PERIOD_ID, reloadKey);

  if (fixtureState.status === "loading") return <WorkloadSkeleton />;

  if (fixtureState.status === "error" || !fixtureState.fixture) {
    return <WorkloadErrorState onRetry={retry} />;
  }

  const fixture = fixtureState.fixture;
  const stale = fixture.freshness.isStale;

  return (
    <div className="flex flex-col gap-4">
      {fixture.freshness.expectedReflectionHours !== null ? (
        <WorkloadReflectionNotice hours={fixture.freshness.expectedReflectionHours} />
      ) : null}
      <WorkloadFreshnessNotice freshness={fixture.freshness} onRetry={retry} />
      <WorkloadOwnView view={fixture.own} stale={stale} variant="self" onRetry={retry} />
    </div>
  );
}