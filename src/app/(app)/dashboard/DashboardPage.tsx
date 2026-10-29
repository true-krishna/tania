"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BarList } from "@/components/BarList";
import { Chip, type ChipVariant } from "@/components/Chip";
import { ErrorState, LoadingState } from "@/components/DataState";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import {
  IconAlertTriangle,
  IconCalendarClock,
  IconClipboardText,
  IconHourglass,
  IconTarget,
  IconUserShield,
  IconUsers,
} from "@tabler/icons-react";
import { orDash } from "@/lib/cell";
import { useSessionRole } from "@/lib/auth/guard";
import { landingRoute } from "@/lib/auth/landing";
import { canAccess } from "@/lib/auth/matrix";
import { roleLabel } from "@/features/accounts/roles";
import { useDashboard } from "@/features/dashboard/useDashboard";
import { EmptyNote } from "./EmptyNote";
import { Panel } from "./Panel";
import { TalentReportContent } from "@/features/talent-report/TalentReportPageView";
import type { AssignmentStatus } from "@/generated/graphql/types";

const ASSIGNMENT_STATUS_LABEL: Record<AssignmentStatus, string> = {
  ACTIVE: "Aktif",
  COMPLETED: "Selesai",
};

const ASSIGNMENT_STATUS_VARIANT: Record<AssignmentStatus, ChipVariant> = {
  ACTIVE: "success",
  COMPLETED: "neutral",
};

export default function DashboardPage() {
  const role = useSessionRole();
  const router = useRouter();
  const { status, data, error } = useDashboard();

  const denied = role !== null && !canAccess(role, "dashboard");
  React.useEffect(() => {
    if (denied) router.replace(landingRoute(role));
  }, [denied, role, router]);

  if (denied) return null;

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={error ?? "Gagal memuat dashboard."} />;
  if (!data) return null;

  const dash = data;

  return (
    <section className="flex flex-col gap-5">
      <PageHeader subtitle="Ringkasan sesuai peran akses Anda." title="Dashboard" />

      {dash.__typename === "AdminDashboard" ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              icon={IconUserShield}
              label="Akun tidak aktif"
              value={dash.inactiveAccounts}
            />
            <StatCard
              icon={IconTarget}
              label="Talent per chapter"
              value={dash.talentsPerChapter.reduce((sum, c) => sum + c.count, 0)}
            />
            <StatCard
              icon={IconUsers}
              label="Total akun"
              value={dash.accountsPerRole.reduce((sum, c) => sum + c.count, 0)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel title="Talent per Chapter">
              {dash.talentsPerChapter.length ? (
                <BarList
                  items={dash.talentsPerChapter.map((c) => ({
                    label: c.chapter.name,
                    value: c.count,
                  }))}
                />
              ) : (
                <EmptyNote>Belum ada talent pada chapter mana pun.</EmptyNote>
              )}
            </Panel>

            <Panel title="Akun per Peran">
              {dash.accountsPerRole.length ? (
                <BarList
                  items={dash.accountsPerRole.map((c) => ({
                    label: roleLabel[c.role],
                    value: c.count,
                  }))}
                />
              ) : (
                <EmptyNote>Belum ada akun.</EmptyNote>
              )}
            </Panel>
          </div>

          <Panel title="Data Master Aktif">
            {dash.masterDataActiveCounts.length ? (
              <ul className="flex flex-col gap-3">
                {dash.masterDataActiveCounts.map((c) => (
                  <li className="flex items-center justify-between gap-3 text-sm" key={c.kind}>
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={IconUsers} label="Karyawan aktif" value={dash.totalActiveEmployees} />
            <StatCard
              hint="FR-40"
              icon={IconAlertTriangle}
              label="Kontrak berakhir ≤ 90 hari"
              value={dash.contractsExpiringIn90Days}
            />
            <StatCard
              hint="FR-40"
              icon={IconCalendarClock}
              label="Kontrak berakhir ≤ 30 hari"
              value={dash.contractsExpiringIn30Days}
            />
            <StatCard
              hint="Usia ≥ batas pensiun − 1 tahun (FR-40)"
              icon={IconHourglass}
              label="Karyawan pra-pensiun"
              value={dash.preRetirementEmployees}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel title="Karyawan per Unit">
              {dash.employeesPerUnit.length ? (
                <BarList
                  items={dash.employeesPerUnit.map((u) => ({ label: u.unit.name, value: u.count }))}
                />
              ) : (
                <EmptyNote>Belum ada karyawan pada unit mana pun.</EmptyNote>
              )}
            </Panel>

            <Panel title="Perubahan data terbaru">
              {dash.recentEmployeeChanges.length ? (
                <ul className="flex flex-col gap-2">
                  {dash.recentEmployeeChanges.map((e) => (
                    <li
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-surface-border px-3 py-2.5"
                      key={e.id}
                    >
                      <span className="text-sm font-medium text-zinc-900">{e.fullName}</span>
                      <span className="text-xs text-zinc-500">{orDash(e.nomorInduk)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyNote>Belum ada perubahan data terbaru.</EmptyNote>
              )}
            </Panel>
          </div>

          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold text-zinc-900">Laporan Talent — seluruh unit</h2>
            <p className="text-sm text-zinc-500">
              Ringkasan seluruh karyawan kontrak berjalan dalam satu laporan org-wide, tanpa dimensi
              chapter.
            </p>
          </div>

          <TalentReportContent />
        </>
      ) : null}

      {dash.__typename === "ChapterDashboard" ? <TalentReportContent /> : null}

      {dash.__typename === "TalentDashboard" ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              icon={IconClipboardText}
              label="Penugasan aktif"
              value={dash.activeAssignments.length}
            />
          </div>

          <Panel title="Penugasan Aktif">
            {dash.activeAssignments.length ? (
              <ul className="flex flex-col gap-2">
                {dash.activeAssignments.map((a) => (
                  <li
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-surface-border px-3 py-2.5"
                    key={a.id}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900">{a.project.name}</p>
                      <p className="text-xs text-zinc-500">
                        {a.periodStart} — {a.periodEnd ?? "…"}
                      </p>
                    </div>
                    <Chip size="small" variant={ASSIGNMENT_STATUS_VARIANT[a.status]}>
                      {ASSIGNMENT_STATUS_LABEL[a.status]}
                    </Chip>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyNote>Belum ada penugasan aktif.</EmptyNote>
            )}
          </Panel>
        </>
      ) : null}
    </section>
  );
}
