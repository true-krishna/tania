"use client";

import Link from "next/link";
import { BoardTable } from "@/components/BoardTable";
import { EmptyState, ErrorState, LoadingState, StatusBadge } from "@/components/DataState";
import { PageHeader } from "@/components/PageHeader";
import { useEvaluationPeriods } from "@/features/evaluations/useEvaluationPeriods";
import { PeriodStateBadge } from "../page";

/**
 * Evaluation periods (Admin) — US7 / FR-25.
 * Lists every evaluation period with its pinned template and derived state
 * (SCHEDULED/RUNNING/CLOSED); Admin can deactivate a period via the toggle.
 */
export default function EvaluationPeriodsPage() {
  const { status, data, error } = useEvaluationPeriods();

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={error ?? "Gagal memuat periode."} />;
  if (!data || data.length === 0)
    return (
      <section className="flex flex-col gap-4">
        <PageHeader
          title="Periode Evaluasi"
          subtitle="Kelola periode evaluasi performa (Admin)."
          actions={
            <Link
              href="/evaluations/periods/new"
              className="inline-flex items-center rounded-md bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-600 active:bg-brand-700"
            >
              + Buat Periode
            </Link>
          }
        />
        <EmptyState message="Belum ada periode evaluasi. Buat periode pertama." />
      </section>
    );

  return (
    <section className="flex flex-col gap-4">
      <PageHeader
        title="Periode Evaluasi"
        subtitle="Kelola periode evaluasi performa (Admin)."
        actions={
          <Link
            href="/evaluations/periods/new"
            className="inline-flex items-center rounded-md bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-600 active:bg-brand-700"
          >
            + Buat Periode
          </Link>
        }
      />
      <BoardTable
        caption="Daftar periode evaluasi"
        columns={[
          { key: "name", label: "Nama" },
          { key: "range", label: "Rentang" },
          { key: "template", label: "Template" },
          { key: "state", label: "State" },
          { key: "status", label: "Status" },
        ]}
      >
        {data.map((period) => (
          <tr key={period.id} className="border-b border-board-border transition-colors hover:bg-zinc-50">
            <td className="px-4 py-2.5 text-zinc-900">{period.name}</td>
            <td className="px-4 py-2.5 text-zinc-600">
              {period.startDate} — {period.endDate}
            </td>
            <td className="px-4 py-2.5 text-zinc-600">{period.template.name}</td>
            <td className="px-4 py-2.5">
              <PeriodStateBadge state={period.state} />
            </td>
            <td className="px-4 py-2.5">
              <StatusBadge active={period.isActive} />
            </td>
          </tr>
        ))}
      </BoardTable>
      <p className="text-xs text-zinc-500">{data.length} periode ditampilkan.</p>
    </section>
  );
}