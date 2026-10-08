"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import type { AccessRole } from "@/generated/graphql";
import { useSessionRole } from "@/lib/auth/guard";
import { DataLamaChip } from "./LoadClassificationBadge";
import { DEFAULT_PERIOD_ID, isWorkloadPeriod } from "./mocks";
import { DistributionBlock } from "./DistributionBlock";
import { TalentList } from "./TalentList";
import { useWorkloadFixture } from "./useWorkloadFixture";
import { WorkloadCard, CardCaption } from "./WorkloadCard";
import { WorkloadEmptyState } from "./WorkloadEmptyState";
import { WorkloadErrorState } from "./WorkloadErrorState";
import { WorkloadFreshnessNotice, WorkloadReflectionNotice } from "./WorkloadFreshnessNotice";
import { WorkloadKpiHero, type HeroKpi } from "./WorkloadHero";
import { WorkloadOwnView } from "./WorkloadOwnView";
import { WorkloadPeriodSelector } from "./WorkloadPeriodSelector";
import { WorkloadSkeleton } from "./WorkloadSkeleton";
import { WorkloadTabs, type WorkloadTab } from "./WorkloadTabs";
import type { ScopeSummary } from "./types";

type TabId = "own" | "chapter" | "org";

/**
 * Role-adaptive landing (SC-003 / US4): CHAPTER lands on the chapter list,
 * OPERATION/ADMIN on the org distribution; `Workload saya` is identical for
 * every role and TALENT sees only that (no tabs).
 */
function tabsForRole(role: AccessRole | null): WorkloadTab[] {
  if (role === "CHAPTER") {
    return [
      { id: "chapter", label: "Chapter saya" },
      { id: "own", label: "Workload saya" },
    ];
  }
  if (role === "OPERATION" || role === "ADMIN") {
    return [
      { id: "org", label: "Distribusi organisasi" },
      { id: "own", label: "Workload saya" },
    ];
  }
  return [{ id: "own", label: "Workload saya" }];
}

function scopeKpis(summary: ScopeSummary): HeroKpi[] {
  return [
    { value: String(summary.talentCount), caption: "Talent dalam scope" },
    { value: String(summary.overloadCount), caption: "Kelebihan beban" },
    { value: String(summary.underloadCount), caption: "Beban kurang" },
    { value: `${summary.averageLoadPercentage}%`, caption: "Rata-rata beban" },
  ];
}

export function WorkloadPageView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = useSessionRole();

  const [reloadKey, setReloadKey] = React.useState(0);
  const retry = React.useCallback(() => setReloadKey((k) => k + 1), []);

  const periodParam = searchParams.get("period");
  const periodId = isWorkloadPeriod(periodParam) ? periodParam : DEFAULT_PERIOD_ID;
  const fixtureState = useWorkloadFixture(periodId, reloadKey);

  const tabs = tabsForRole(role);
  const [activeTab, setActiveTab] = React.useState<TabId>(tabs[0].id as TabId);
  // Role can change between renders (local-only role switch) — fall back to the
  // role's landing tab when the selected one is no longer offered.
  const selectedTab: TabId = tabs.some((t) => t.id === activeTab) ? activeTab : (tabs[0].id as TabId);

  function setPeriod(nextPeriodId: string) {
    router.replace(`/workload?period=${nextPeriodId}`);
  }

  const fixture = fixtureState.status === "ready" ? fixtureState.fixture : null;
  const stale = fixture?.freshness.isStale ?? false;

  let content: React.ReactNode;
  if (fixtureState.status === "loading") {
    content = <WorkloadSkeleton />;
  } else if (fixtureState.status === "error" || !fixture) {
    content = <WorkloadErrorState onRetry={retry} />;
  } else if (selectedTab === "own") {
    content = (
      <div className="flex flex-col gap-4">
        {fixture.freshness.expectedReflectionHours !== null ? (
          <WorkloadReflectionNotice hours={fixture.freshness.expectedReflectionHours} />
        ) : null}
        <WorkloadOwnView view={fixture.own} stale={stale} variant="self" onRetry={retry} />
      </div>
    );
  } else if (selectedTab === "chapter") {
    const chapter = fixture.chapter;
    if (chapter.state === "error") {
      content = <WorkloadErrorState onRetry={retry} />;
    } else if (chapter.state === "no-data" || !chapter.summary) {
      content = <WorkloadEmptyState variant="no-data" />;
    } else {
      content = (
        <div className="flex flex-col gap-4">
          <WorkloadKpiHero label="Ringkasan chapter" kpis={scopeKpis(chapter.summary)} />
          <WorkloadCard
            title={`Talent dalam ${chapter.summary.scopeLabel}`}
            action={stale ? <DataLamaChip /> : <CardCaption>Urut dari beban tertinggi</CardCaption>}
          >
            <TalentList talents={chapter.talents} totalCount={chapter.totalCount} />
          </WorkloadCard>
        </div>
      );
    }
  } else {
    const org = fixture.org;
    if (org.state === "error") {
      content = <WorkloadErrorState onRetry={retry} />;
    } else if (org.state === "no-data" || !org.summary) {
      content = <WorkloadEmptyState variant="no-data" />;
    } else {
      content = (
        <div className="flex flex-col gap-4">
          <WorkloadKpiHero label="Ringkasan organisasi" kpis={scopeKpis(org.summary)} />
          <WorkloadCard
            title="Distribusi beban"
            action={stale ? <DataLamaChip /> : <CardCaption>Rata-rata per scope</CardCaption>}
          >
            <DistributionBlock rows={org.rows} />
          </WorkloadCard>
        </div>
      );
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <PageHeader
        title="Workload"
        subtitle="Pantau beban kerja talent dari data WAD — hanya baca, tanpa perhitungan ulang di UI."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        {tabs.length > 1 ? (
          <WorkloadTabs tabs={tabs} value={selectedTab} onChange={(id) => setActiveTab(id as TabId)} />
        ) : (
          <span />
        )}
        <div className="ml-auto">
          <WorkloadPeriodSelector value={periodId} onChange={setPeriod} />
        </div>
      </div>

      {fixture ? <WorkloadFreshnessNotice freshness={fixture.freshness} onRetry={retry} /> : null}

      {content}
    </section>
  );
}
