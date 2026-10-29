"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/DataState";
import { useSessionRole } from "@/lib/auth/guard";
import { WORKLOAD_EXECUTIVE } from "@/lib/constants/routes";
import {
  WorkloadErrorState,
  WorkloadFreshnessNotice,
  WorkloadReflectionNotice,
  WorkloadTabs,
  type WorkloadTab,
} from "@/features/workload";
import { AnalyticsTables } from "./AnalyticsTables";
import { DistributionSection } from "./DistributionSection";
import { ExecutiveCharts } from "./ExecutiveCharts";
import { ExecutiveAnalyticsKpis } from "./ExecutiveAnalyticsKpis";
import { ExecutiveCostKpis } from "./ExecutiveCostKpis";
import { ExecutiveWorkloadKpis } from "./ExecutiveWorkloadKpis";
import {
  COST_REVENUE_SOURCE_NOTE,
  DEFAULT_REPORT_PERIOD,
  formatPeriodLabel,
  isReportPeriod,
} from "./mocks";
import { ReportPeriodSelector } from "./ReportPeriodSelector";
import { ReportSkeleton } from "./ReportSkeleton";
import { useExecutiveReport } from "./useExecutiveReport";
import { COST_REVENUE_ROLES, WORKLOAD_REPORT_ROLES } from "./types";

type ExecutiveTab = "details" | "analytics" | "cost";

export function ExecutiveReportView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = useSessionRole();

  const [reloadKey, setReloadKey] = React.useState(0);
  const retry = React.useCallback(() => setReloadKey((k) => k + 1), []);

  const periodParam = searchParams.get("period");
  const period = isReportPeriod(periodParam) ? periodParam : DEFAULT_REPORT_PERIOD;
  const fixtureState = useExecutiveReport(period, reloadKey);

  const [activeTab, setActiveTab] = React.useState<ExecutiveTab>("details");

  function setPeriod(next: string) {
    router.replace(`${WORKLOAD_EXECUTIVE}?period=${next}`);
  }

  if (!role || !WORKLOAD_REPORT_ROLES.includes(role)) {
    return null;
  }

  const canSeeCost = COST_REVENUE_ROLES.includes(role);
  const tabs: WorkloadTab[] = [
    { id: "details", label: "Workload Details" },
    { id: "analytics", label: "Analytics Insights" },
    ...(canSeeCost ? [{ id: "cost", label: "Cost & Revenue" }] : []),
  ];
  const selectedTab: ExecutiveTab = tabs.some((t) => t.id === activeTab) ? activeTab : "details";

  const fixture = fixtureState.status === "ready" ? fixtureState.fixture : null;

  let content: React.ReactNode;
  if (fixtureState.status === "loading") {
    content = <ReportSkeleton variant="executive" />;
  } else if (fixtureState.status === "error" || !fixture) {
    content = <WorkloadErrorState onRetry={retry} />;
  } else if (
    fixture.state === "empty" ||
    !fixture.summary ||
    !fixture.charts ||
    !fixture.distribution ||
    !fixture.analytics
  ) {
    content = (
      <EmptyState
        message={`Belum ada data workload untuk periode ${formatPeriodLabel(fixture.period)}. Angka akan muncul begitu periode ini terisi di sumber data.`}
      />
    );
  } else {
    content = (
      <div className="flex flex-col gap-4">
        {selectedTab === "details" ? (
          <>
            <ExecutiveWorkloadKpis summary={fixture.summary} />
            <ExecutiveCharts charts={fixture.charts} />
            <DistributionSection canSeeCost={canSeeCost} tables={fixture.distribution} />
          </>
        ) : null}
        {selectedTab === "analytics" ? (
          <>
            <ExecutiveAnalyticsKpis summary={fixture.summary} />
            <AnalyticsTables analytics={fixture.analytics} />
          </>
        ) : null}
        {selectedTab === "cost" ? (
          <>
            <p className="text-[13px] text-tp-muted">{COST_REVENUE_SOURCE_NOTE}</p>
            <ExecutiveCostKpis summary={fixture.summary} />
          </>
        ) : null}
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <PageHeader
        subtitle={`Pantau beban kerja organisasi dari data WAD — periode ${formatPeriodLabel(period)}.`}
        title="Workload Executive"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <WorkloadTabs
          onChange={(id) => setActiveTab(id as ExecutiveTab)}
          tabs={tabs}
          value={selectedTab}
        />
        <div className="ml-auto">
          <ReportPeriodSelector onChange={setPeriod} value={period} />
        </div>
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
