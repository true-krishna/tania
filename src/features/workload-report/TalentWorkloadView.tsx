"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/Card";
import { Select } from "@/components/Select";
import { EmptyState } from "@/components/DataState";
import { PageHeader } from "@/components/PageHeader";
import { useSessionRole } from "@/lib/auth/guard";
import { WORKLOAD_TALENT } from "@/lib/constants/routes";
import {
  WorkloadErrorState,
  WorkloadFreshnessNotice,
  WorkloadReflectionNotice,
} from "@/features/workload";
import { IndividualCharts } from "./IndividualCharts";
import { IndividualLeavesCard, IndividualSummaryCards } from "./IndividualSummaryCards";
import { BacklogTable } from "./BacklogTable";
import {
  DEFAULT_TALENT_ID,
  REPORT_TALENT_OPTIONS,
  formatPeriodLabel,
  isReportPeriod,
  DEFAULT_REPORT_PERIOD,
} from "./mocks";
import { ReportPeriodSelector } from "./ReportPeriodSelector";
import { ReportSkeleton } from "./ReportSkeleton";
import { useTalentWorkload } from "./useTalentWorkload";
import { WORKLOAD_REPORT_ROLES } from "./types";

/**
 * Halaman workload per talent (TAN-227/233/234). Konteks talent dipilih di
 * halaman dan tidak pernah ditaruh di URL atau query string (TAN-233) — hanya
 * `?period=` yang menjelajah URL.
 */
export function TalentWorkloadView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = useSessionRole();

  const [talentId, setTalentId] = React.useState<string>(DEFAULT_TALENT_ID);
  const [reloadKey, setReloadKey] = React.useState(0);
  const retry = React.useCallback(() => setReloadKey((k) => k + 1), []);

  const periodParam = searchParams.get("period");
  const period = isReportPeriod(periodParam) ? periodParam : DEFAULT_REPORT_PERIOD;
  const fixtureState = useTalentWorkload(period, talentId, reloadKey);

  function setPeriod(next: string) {
    router.replace(`${WORKLOAD_TALENT}?period=${next}`);
  }

  if (!role || !WORKLOAD_REPORT_ROLES.includes(role)) {
    return null;
  }

  const selectedTalent = REPORT_TALENT_OPTIONS.find((t) => t.talentId === talentId) ?? null;
  const fixture = fixtureState.status === "ready" ? fixtureState.fixture : null;

  let content: React.ReactNode;
  if (fixtureState.status === "loading") {
    content = <ReportSkeleton variant="talent" />;
  } else if (fixtureState.status === "error") {
    content = <WorkloadErrorState onRetry={retry} />;
  } else if (!selectedTalent || !fixture) {
    content = <EmptyState message="Pilih talent untuk melihat laporan workload-nya." />;
  } else if (fixture.state === "empty" || !fixture.summary) {
    content = (
      <EmptyState
        message={`Belum ada data workload untuk ${selectedTalent.name} pada periode ${formatPeriodLabel(fixture.period)}.`}
      />
    );
  } else {
    content = (
      <div className="flex flex-col gap-4">
        <IndividualSummaryCards summary={fixture.summary} />
        {fixture.assignedProjects ? (
          <Card className="flex flex-col gap-4">
            <div>
              <h2 className="tp-h3">Assignments</h2>
              <p className="tp-label mt-1">Penempatan project talent pada periode terpilih.</p>
            </div>
            <div className="table-panel">
              <div className="table-scroll">
                <table className="w-full min-w-[720px]">
                  <caption className="sr-only">Tabel assignment project talent</caption>
                  <thead>
                    <tr>
                      <th scope="col" className="text-left">Project</th>
                      <th scope="col" className="text-left">Tribe</th>
                      <th scope="col" className="text-left">Product</th>
                      <th scope="col" className="text-left">Squad</th>
                      <th scope="col" className="text-right">Availability</th>
                      <th scope="col" className="text-right">Time Spent</th>
                      <th scope="col" className="text-left">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fixture.assignedProjects.map((row) => (
                      <tr key={`${row.projectKey}-${row.squad}`}>
                        <td className="font-medium text-tp-text">{row.projectKey}</td>
                        <td>{row.tribe}</td>
                        <td>{row.product}</td>
                        <td>{row.squad}</td>
                        <td className="text-right">{row.availability}%</td>
                        <td className="text-right">{row.timespent} jam</td>
                        <td className="max-w-[320px]">{row.category}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        ) : null}
        {fixture.summary.leaves && fixture.summary.leaves.leavesList.length > 0 ? (
          <Card className="flex flex-col gap-3">
            <h2 className="tp-h3">Cuti & ketidakhadiran</h2>
            <IndividualLeavesCard leaves={fixture.summary.leaves} />
          </Card>
        ) : null}
        {fixture.statusBacklog && fixture.timespentPerProject && fixture.trendBacklog ? (
          <IndividualCharts
            statusBacklog={fixture.statusBacklog}
            timespentPerProject={fixture.timespentPerProject}
            trendBacklog={fixture.trendBacklog}
          />
        ) : null}
        {fixture.backlog && fixture.backlogNormalized ? (
          <BacklogTable backlog={fixture.backlog} backlogNormalized={fixture.backlogNormalized} />
        ) : null}
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <PageHeader
        title="Workload Talent"
        subtitle={
          selectedTalent
            ? `Laporan per talent — ${selectedTalent.name} · ${selectedTalent.tribe} · ${selectedTalent.squad} · periode ${formatPeriodLabel(period)}.`
            : "Laporan workload per talent."
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-[13px] font-semibold text-tp-muted">
          Talent
          <Select
            aria-label="Pilih talent"
            className="h-11 w-64"
            value={talentId}
            onChange={(e) => setTalentId(e.target.value)}
            options={REPORT_TALENT_OPTIONS.map((t) => ({ value: t.talentId, label: t.name }))}
          />
        </label>
        <ReportPeriodSelector value={period} onChange={setPeriod} ariaLabel="Pilih periode laporan talent" />
      </div>

      {fixture ? (
        <>
          <WorkloadFreshnessNotice freshness={fixture.freshness} onRetry={retry} />
          {fixture.freshness.expectedReflectionHours !== null ? (
            <WorkloadReflectionNotice hours={fixture.freshness.expectedReflectionHours} />
          ) : null}
        </>
      ) : null}

      {content}
    </section>
  );
}
