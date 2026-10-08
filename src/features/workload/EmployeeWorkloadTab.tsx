import { HanyaBacaChip } from "./LoadClassificationBadge";
import { getEmployeeWorkload } from "./mocks";
import { WorkloadFreshnessNotice } from "./WorkloadFreshnessNotice";
import { WorkloadOwnView } from "./WorkloadOwnView";

/**
 * Embedded workload tab on `/employees/[id]` (TAN-117; design scene 7).
 * Read-only and identical to the own view, with the project-context card in
 * place of the activity-capture card — no forked components, no editing.
 */
export function EmployeeWorkloadTab({ employeeId }: { employeeId: string }) {
  const fixture = getEmployeeWorkload(employeeId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-tp-muted">
          Workload {fixture.fullName} — {fixture.jobRoleName}
        </p>
        <HanyaBacaChip />
      </div>
      <WorkloadFreshnessNotice freshness={fixture.freshness} />
      <WorkloadOwnView view={fixture.view} stale={fixture.freshness.isStale} variant="employee" />
    </div>
  );
}
