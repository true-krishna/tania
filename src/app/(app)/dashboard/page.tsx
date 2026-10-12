"use client";

import * as React from "react";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { BarList } from "@/components/BarList";
import { Card } from "@/components/Card";
import { ErrorState, LoadingState } from "@/components/DataState";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import {
  IconClipboardCheck,
  IconClipboardText,
  IconDatabase,
  IconTarget,
  IconUserShield,
  IconUsers,
} from "@tabler/icons-react";
import { roleLabel } from "@/features/accounts/roles";
import { useDashboard } from "@/features/dashboard/useDashboard";
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

function Panel({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={`flex flex-col gap-4 ${className ?? ""}`}>
      <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
      {children}
    </Card>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-zinc-500">{children}</p>;
}

function PersonRow({ name, code }: { name: string; code: string | null }) {
  return (
    <li className="flex items-center gap-3 rounded-lg border border-surface-border px-3 py-2">
      <Avatar name={name} />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-zinc-900">{name}</p>
        <p className="truncate text-xs text-zinc-500">{code ?? "—"}</p>
      </div>
    </li>
  );
}

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
    <section className="flex flex-col gap-5">
      <PageHeader title="Dashboard" subtitle="Ringkasan sesuai peran akses Anda." />

      {dash.__typename === "AdminDashboard" ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Akun tidak aktif" value={dash.inactiveAccounts} icon={IconUserShield} />
            <StatCard
              label="Talent per chapter"
              value={dash.talentsPerChapter.reduce((sum, c) => sum + c.count, 0)}
              icon={IconTarget}
            />
            <StatCard
              label="Total akun"
              value={dash.accountsPerRole.reduce((sum, c) => sum + c.count, 0)}
              icon={IconUsers}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel title="Talent per Chapter">
              {dash.talentsPerChapter.length ? (
                <BarList items={dash.talentsPerChapter.map((c) => ({ label: c.chapter.name, value: c.count }))} />
              ) : (
                <EmptyNote>Belum ada talent pada chapter mana pun.</EmptyNote>
              )}
            </Panel>

            <Panel title="Akun per Peran">
              {dash.accountsPerRole.length ? (
                <BarList items={dash.accountsPerRole.map((c) => ({ label: roleLabel[c.role], value: c.count }))} />
              ) : (
                <EmptyNote>Belum ada akun.</EmptyNote>
              )}
            </Panel>
          </div>

          <Panel title="Data Master Aktif">
            {dash.masterDataActiveCounts.length ? (
              <ul className="flex flex-col gap-3">
                {dash.masterDataActiveCounts.map((c) => (
                  <li key={c.kind} className="flex items-center justify-between gap-3 text-sm">
                    <span className="capitalize text-zinc-600">{c.kind}</span>
                    <span className="text-zinc-500">
                      <span className="font-semibold text-zinc-900">{c.active}</span> aktif ·{" "}
                      <span className="font-semibold text-zinc-900">{c.inactive}</span> nonaktif
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyNote>Belum ada data master.</EmptyNote>
            )}
          </Panel>
        </>
      ) : null}

      {dash.__typename === "OperationDashboard" ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Karyawan aktif" value={dash.totalActiveEmployees} icon={IconUsers} />
            <StatCard label="Tidak assignable" value={dash.nonAssignableEmployees} icon={IconClipboardText} />
            <StatCard label="Unit" value={dash.employeesPerUnit.length} icon={IconDatabase} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel title="Karyawan per Unit">
              {dash.employeesPerUnit.length ? (
                <BarList items={dash.employeesPerUnit.map((u) => ({ label: u.unit.name, value: u.count }))} />
              ) : (
                <EmptyNote>Belum ada karyawan per unit.</EmptyNote>
              )}
            </Panel>

            <Panel title="Perubahan Karyawan Terbaru">
              {dash.recentEmployeeChanges.length ? (
                <ul className="flex flex-col gap-2">
                  {dash.recentEmployeeChanges.map((e) => (
                    <PersonRow key={e.id} name={e.fullName} code={e.nomorInduk} />
                  ))}
                </ul>
              ) : (
                <EmptyNote>Belum ada perubahan terbaru.</EmptyNote>
              )}
            </Panel>
          </div>
        </>
      ) : null}

      {dash.__typename === "ChapterDashboard" ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="IDP perlu review" value={dash.idpsNeedingReview} icon={IconTarget} />
            <StatCard
              label="Talent tanpa penugasan"
              value={dash.unassignedTalents.length}
              icon={IconClipboardText}
            />
            <StatCard
              label="Periode evaluasi"
              value={dash.currentEvaluationPeriod ? PERIOD_STATE_LABEL[dash.currentEvaluationPeriod.state] : "—"}
              icon={IconClipboardCheck}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel title="Distribusi Status IDP">
              {dash.idpStatusDistribution.length ? (
                <BarList items={dash.idpStatusDistribution.map((c) => ({ label: IDP_STATUS_LABEL[c.status], value: c.count }))} />
              ) : (
                <EmptyNote>Belum ada IDP.</EmptyNote>
              )}
            </Panel>

            <Panel title="Progres Aksi">
              {dash.actionProgress.length ? (
                <BarList items={dash.actionProgress.map((c) => ({ label: ACTION_STATUS_LABEL[c.status], value: c.count }))} />
              ) : (
                <EmptyNote>Belum ada aksi pengembangan.</EmptyNote>
              )}
            </Panel>
          </div>

          <Panel title="Talent Tanpa Penugasan">
            {dash.unassignedTalents.length ? (
              <ul className="flex flex-col gap-2">
                {dash.unassignedTalents.map((e) => (
                  <PersonRow key={e.id} name={e.fullName} code={e.nomorInduk} />
                ))}
              </ul>
            ) : (
              <EmptyNote>Semua talent sudah memiliki penugasan.</EmptyNote>
            )}
          </Panel>
        </>
      ) : null}

      {dash.__typename === "TalentDashboard" ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Penugasan aktif" value={dash.activeAssignments.length} icon={IconClipboardText} />
            <StatCard
              label="Evaluasi terakhir"
              value={dash.latestEvaluation ? EVAL_STATUS_LABEL[dash.latestEvaluation.status] : "—"}
              icon={IconClipboardCheck}
            />
            <StatCard label="Aksi segera" value={dash.upcomingActionDeadlines.length} icon={IconTarget} />
          </div>

          <Panel title="Penugasan Aktif">
            {dash.activeAssignments.length ? (
              <ul className="flex flex-col gap-2">
                {dash.activeAssignments.map((a) => (
                  <li
                    key={a.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-surface-border px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900">{a.project.name}</p>
                      <p className="text-xs text-zinc-500">
                        {a.jobRole.name} · {a.periodStart} — {a.periodEnd ?? "…"}
                      </p>
                    </div>
                    <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                      {ASSIGNMENT_STATUS_LABEL[a.status]}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyNote>Belum ada penugasan aktif.</EmptyNote>
            )}
          </Panel>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel title="Progres Aksi IDP">
              {dash.idpProgress.length ? (
                <BarList items={dash.idpProgress.map((c) => ({ label: ACTION_STATUS_LABEL[c.status], value: c.count }))} />
              ) : (
                <EmptyNote>Belum ada aksi IDP.</EmptyNote>
              )}
            </Panel>

            <Panel title="Tenggat Aksi Terdekat">
              {dash.upcomingActionDeadlines.length ? (
                <ul className="flex flex-col gap-2">
                  {dash.upcomingActionDeadlines.map((a) => (
                    <li
                      key={a.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-surface-border px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900">{a.description}</p>
                        <p className="text-xs text-zinc-500">{METHOD_LABEL[a.method]}</p>
                      </div>
                      <span className="text-xs text-zinc-500">
                        {[a.dueDate, a.status === "COMPLETED" ? "Selesai" : ""].filter(Boolean).join(" · ")}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyNote>Tidak ada tenggat aksi segera.</EmptyNote>
              )}
            </Panel>
          </div>

          <p className="text-sm">
            <Link href="/idp/my" className="font-medium text-brand hover:text-brand-600">
              Lihat IDP saya →
            </Link>
          </p>
        </>
      ) : null}
    </section>
  );
}