"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EmptyState } from "@/components/DataState";
import { PageHeader } from "@/components/PageHeader";
import { useSessionRole } from "@/lib/auth/guard";
import { WORKLOAD } from "@/lib/constants/routes";
import {
  WorkloadErrorState,
  WorkloadFreshnessNotice,
  WorkloadReflectionNotice,
} from "@/features/workload";
import { SELF_TALENT_ID, formatPeriodLabel, isReportPeriod, DEFAULT_REPORT_PERIOD } from "./mocks";
import { ReportPeriodSelector } from "./ReportPeriodSelector";
import { ReportSkeleton } from "./ReportSkeleton";
import { TalentWorkloadDetail } from "./TalentWorkloadDetail";
import { useTalentWorkload } from "./useTalentWorkload";

export function TalentOwnWorkloadView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = useSessionRole();

  const [reloadKey, setReloadKey] = React.useState(0);
  const retry = React.useCallback(() => setReloadKey((k) => k + 1), []);

  const periodParam = searchParams.get("period");
  const period = isReportPeriod(periodParam) ? periodParam : DEFAULT_REPORT_PERIOD;
  const fixtureState = useTalentWorkload(period, SELF_TALENT_ID, reloadKey);

  function setPeriod(next: string) {
    router.replace(`${WORKLOAD}?period=${next}`);
  }

  if (!role || role !== "TALENT") {
    return null;
  }

  const fixture = fixtureState.status === "ready" ? fixtureState.fixture : null;

  let content: React.ReactNode;
  if (fixtureState.status === "loading") {
    content = <ReportSkeleton variant="talent" />;
  } else if (fixtureState.status === "error" || !fixture) {
    content = <WorkloadErrorState onRetry={retry} />;
  } else if (fixture.state === "empty" || !fixture.summary) {
    content = (
      <EmptyState
        message={`Belum ada data workload untuk periode ${formatPeriodLabel(fixture.period)}. Angka akan muncul begitu periode ini terisi di sumber data.`}
      />
    );
  } else {
    content = <TalentWorkloadDetail fixture={fixture} />;
  }

  return (
    <section className="flex flex-col gap-4">
      <PageHeader
        subtitle={`Beban kerja kamu dari data WAD — periode ${formatPeriodLabel(period)}.`}
        title="Workload"
      />

      <div className="flex flex-wrap items-center justify-end gap-3">
        <ReportPeriodSelector ariaLabel="Pilih periode workload" onChange={setPeriod} value={period} />
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