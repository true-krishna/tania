import { HanyaBacaChip } from "./LoadClassificationBadge";
import { getEmployeeWorkload } from "./mocks";
import { WorkloadFreshnessNotice } from "./WorkloadFreshnessNotice";
import { WorkloadOwnView } from "./WorkloadOwnView";

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
      <WorkloadOwnView stale={fixture.freshness.isStale} variant="employee" view={fixture.view} />
    </div>
  );
}
