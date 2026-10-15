"use client";

import * as React from "react";
import { BarList } from "@/components/BarList";
import { Card } from "@/components/Card";
import { ErrorState, LoadingState } from "@/components/DataState";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import {
  IconClipboardText,
  IconTarget,
  IconUserShield,
  IconUsers,
} from "@tabler/icons-react";
import { roleLabel } from "@/features/accounts/roles";
import { useDashboard } from "@/features/dashboard/useDashboard";
import { TalentReportContent } from "@/features/talent-report/TalentReportPageView";
import type { AssignmentStatus } from "@/generated/graphql/types";

const ASSIGNMENT_STATUS_LABEL: Record<AssignmentStatus, string> = {
  ACTIVE: "Aktif",
  COMPLETED: "Selesai",
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

/**
 * Role-scoped dashboard (US4 / FR-30). The served SDL returns a `Dashboard`
 * union; the concrete member is narrowed from `__typename`, then the matching
 * widget groups render. Data is kept fresh via `cache-and-network` (FR-30).
 *
 * Amandemen penempatan (2026-10-12, keputusan pemilik produk, TAN-154):
 * untuk OperationDashboard & ChapterDashboard konten widget digantikan oleh
 * konten Laporan Talent (TalentReportContent); Admin & Talent tetap
 * melihat widget eksisting — laporan talent adalah konten Operation/Chapter.
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

      {dash.__typename === "OperationDashboard" ? <TalentReportContent /> : null}

      {dash.__typename === "ChapterDashboard" ? <TalentReportContent /> : null}

      {dash.__typename === "TalentDashboard" ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Penugasan aktif" value={dash.activeAssignments.length} icon={IconClipboardText} />
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
                    <span className="rounded-md bg-tp-tint-info px-2 py-0.5 text-xs font-semibold text-tp-ink-info">
                      {ASSIGNMENT_STATUS_LABEL[a.status]}
                    </span>
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