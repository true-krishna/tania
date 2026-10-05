"use client";

import * as React from "react";
import Link from "next/link";
import { ErrorState, LoadingState } from "@/components/DataState";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { roleLabel } from "@/features/accounts/roles";
import { useDashboard } from "@/features/dashboard/useDashboard";
import { cn } from "@/lib/cn";
import type {
  AssignmentStatus,
  DevelopmentActionStatus,
  DevelopmentMethod,
  EvaluationPeriodState,
  IdpStatus,
  PerformanceEvaluationStatus,
} from "@/generated/graphql/types";

const IDP_STATUS_LABEL: Record<IdpStatus, string> = {
  IN_PROGRESS: "Berjalan",
  NEEDS_REVIEW: "Perlu review",
  COMPLETED: "Selesai",
};

const ACTION_STATUS_LABEL: Record<DevelopmentActionStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
};

const METHOD_LABEL: Record<DevelopmentMethod, string> = {
  PROJECT_ASSIGNMENT: "Penugasan project",
  MENTORING: "Mentoring",
  TRAINING: "Training",
  CROSS_FUNCTIONAL_EXPOSURE: "Exposure lintas fungsi",
  SELF_STUDY: "Belajar mandiri",
};

const ASSIGNMENT_STATUS_LABEL: Record<AssignmentStatus, string> = {
  ACTIVE: "Aktif",
  COMPLETED: "Selesai",
};

const EVAL_STATUS_LABEL: Record<PerformanceEvaluationStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Dikirim",
};

const PERIOD_STATE_LABEL: Record<EvaluationPeriodState, string> = {
  SCHEDULED: "Terjadwal",
  RUNNING: "Berjalan",
  CLOSED: "Ditutup",
};

const ROW =
  "flex items-center justify-between gap-3 rounded-md border border-surface-border px-3 py-2 text-sm";

function CountRow({ label, count, highlight = false }: { label: string; count: number; highlight?: boolean }) {
  return (
    <li className={cn(ROW, highlight && "border-brand-200 bg-brand-50")}>
      <span className="text-zinc-700">{label}</span>
      <span className="font-semibold text-zinc-900">{count}</span>
    </li>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border border-surface-border px-3 py-2">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-0.5 text-lg font-semibold text-zinc-900">{value}</p>
    </div>
  );
}

const STATUS_DOT: Record<DevelopmentActionStatus, string> = {
  TODO: "bg-zinc-300",
  IN_PROGRESS: "bg-brand-400",
  COMPLETED: "bg-green-500",
};

/**
 * Role-scoped dashboard (US4 / FR-30). The served SDL returns a `Dashboard`
 * union; the concrete member is narrowed from `__typename`, then the matching
 * widget groups render. Data is kept fresh via `cache-and-network` (FR-30).
 */
export default function DashboardPage() {
  const { status, data, error } = useDashboard();

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={error ?? "Gagal memuat dashboard."} />;
  if (!data) return null;

  const dash = data;

  return (
    <section className="flex flex-col gap-4">
      <PageHeader
        title="Dashboard"
        subtitle="Ringkasan sesuai peran akses Anda."
      />

      {dash.__typename === "AdminDashboard" ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Stat label="Akun tidak aktif" value={dash.inactiveAccounts} />
            <Stat label="Talent per chapter" value={dash.talentsPerChapter.reduce((s, c) => s + c.count, 0)} />
            <Stat label="Total akun" value={dash.accountsPerRole.reduce((s, c) => s + c.count, 0)} />
          </div>

          <Card className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-zinc-900">Talent per Chapter</h2>
            <ul className="flex flex-col gap-2">
              {dash.talentsPerChapter.map((c) => (
                <CountRow key={c.chapter.id} label={c.chapter.name} count={c.count} />
              ))}
            </ul>
          </Card>

          <Card className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-zinc-900">Akun per Peran</h2>
            <ul className="flex flex-col gap-2">
              {dash.accountsPerRole.map((c) => (
                <CountRow key={c.role} label={roleLabel[c.role]} count={c.count} />
              ))}
            </ul>
          </Card>

          <Card className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-zinc-900">Data Master Aktif</h2>
            <ul className="flex flex-col gap-2">
              {dash.masterDataActiveCounts.map((c) => (
                <li key={c.kind} className="flex items-center justify-between gap-3 text-sm">
                  <span className="capitalize text-zinc-700">{c.kind}</span>
                  <span className="text-zinc-600">
                    {c.active} aktif · {c.inactive} nonaktif
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      ) : null}

      {dash.__typename === "OperationDashboard" ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Stat label="Karyawan aktif" value={dash.totalActiveEmployees} />
            <Stat label="Tidak assignable" value={dash.nonAssignableEmployees} />
            <Stat label="Unit" value={dash.employeesPerUnit.length} />
          </div>

          <Card className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-zinc-900">Karyawan per Unit</h2>
            <ul className="flex flex-col gap-2">
              {dash.employeesPerUnit.map((u) => (
                <CountRow key={u.unit.id} label={u.unit.name} count={u.count} />
              ))}
            </ul>
          </Card>

          <Card className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-zinc-900">Perubahan Karyawan Terbaru</h2>
            <ul className="flex flex-col gap-2">
              {dash.recentEmployeeChanges.map((e) => (
                <li key={e.id} className={ROW}>
                  <span className="text-zinc-700">{e.fullName}</span>
                  <span className="text-xs text-zinc-500">{e.employeeCode}</span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      ) : null}

      {dash.__typename === "ChapterDashboard" ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Stat
              label="IDP perlu review"
              value={dash.idpsNeedingReview}
            />
            <Stat label="Talent tanpa penugasan" value={dash.unassignedTalents.length} />
            <Stat
              label="Periode evaluasi"
              value={dash.currentEvaluationPeriod ? PERIOD_STATE_LABEL[dash.currentEvaluationPeriod.state] : "—"}
            />
          </div>

          <Card className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-zinc-900">Distribusi Status IDP</h2>
            <ul className="flex flex-col gap-2">
              {dash.idpStatusDistribution.map((c) => (
                <CountRow key={c.status} label={IDP_STATUS_LABEL[c.status]} count={c.count} />
              ))}
            </ul>
          </Card>

          <Card className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-zinc-900">Progres Aksi</h2>
            <ul className="flex flex-col gap-2">
              {dash.actionProgress.map((c) => (
                <CountRow key={c.status} label={ACTION_STATUS_LABEL[c.status]} count={c.count} />
              ))}
            </ul>
          </Card>

          <Card className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-zinc-900">Talent Tanpa Penugasan</h2>
            <ul className="flex flex-col gap-2">
              {dash.unassignedTalents.map((e) => (
                <li key={e.id} className={ROW}>
                  <span className="text-zinc-700">{e.fullName}</span>
                  <span className="text-xs text-zinc-500">{e.employeeCode}</span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      ) : null}

      {dash.__typename === "TalentDashboard" ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Stat label="Penugasan aktif" value={dash.activeAssignments.length} />
            <Stat
              label="Evaluasi terakhir"
              value={dash.latestEvaluation ? EVAL_STATUS_LABEL[dash.latestEvaluation.status] : "—"}
            />
            <Stat label="Aksi segera" value={dash.upcomingActionDeadlines.length} />
          </div>

          <Card className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-zinc-900">Penugasan Aktif</h2>
            <ul className="flex flex-col gap-2">
              {dash.activeAssignments.map((a) => (
                <li key={a.id} className={ROW}>
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{a.project.name}</p>
                    <p className="text-xs text-zinc-500">
                      {a.jobRole.name} · {a.periodStart} — {a.periodEnd ?? "…"}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-zinc-600">
                    {ASSIGNMENT_STATUS_LABEL[a.status]}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-zinc-900">Progres Aksi IDP</h2>
            <ul className="flex flex-col gap-2">
              {dash.idpProgress.map((c) => (
                <li key={c.status} className={cn(ROW)}>
                  <span className="inline-flex items-center gap-2 text-zinc-700">
                    <span className={cn("h-2 w-2 rounded-full", STATUS_DOT[c.status])} />
                    {ACTION_STATUS_LABEL[c.status]}
                  </span>
                  <span className="font-semibold text-zinc-900">{c.count}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-zinc-900">Tenggat Aksi Terdekat</h2>
            {dash.upcomingActionDeadlines.length ? (
              <ul className="flex flex-col gap-2">
                {dash.upcomingActionDeadlines.map((a) => (
                  <li key={a.id} className={ROW}>
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{a.description}</p>
                      <p className="text-xs text-zinc-500">{METHOD_LABEL[a.method]}</p>
                    </div>
                    <span className="text-xs text-zinc-500">{[a.dueDate, a.status === "COMPLETED" ? "Selesai" : ""].filter(Boolean).join(" · ")}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-500">Tidak ada tenggat aksi segera.</p>
            )}
          </Card>

          <p className="text-sm">
            <Link href="/idp/my" className="font-medium text-brand-600 hover:text-brand-700">
              Lihat IDP saya →
            </Link>
          </p>
        </>
      ) : null}
    </section>
  );
}