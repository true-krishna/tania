"use client";

import Link from "next/link";
import * as React from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { useTablePagination } from "@/components/Pagination";
import { TableFilterBar } from "@/components/TableFilterBar";
import { useCurrentEvaluationPeriod } from "@/features/evaluations/useCurrentEvaluationPeriod";
import { useEvaluationRoster } from "@/features/evaluations/useEvaluationRoster";
import { PeriodStateBadge } from "@/features/evaluations/PeriodStateBadge";
import { useModuleAccess } from "@/lib/auth/access";
import { useSessionRole } from "@/lib/auth/guard";
import { EVALUATIONS_MY, EVALUATION_PERIODS } from "@/lib/constants/routes";
import { EvaluationsTable } from "./EvaluationsTable";

export default function EvaluationsPage() {
  const role = useSessionRole();
  const canManageEvaluations = useModuleAccess("evaluations").canManage;
  const current = useCurrentEvaluationPeriod();
  const roster = useEvaluationRoster(current.data?.id ?? null);
  const period = current.data;
  const [search, setSearch] = React.useState("");
  const { pageRows, pagination } = useTablePagination(
    React.useMemo(() => {
      const needle = search.trim().toLowerCase();
      if (!needle) return roster.data;
      return (roster.data ?? []).filter((entry) =>
        entry.talent.fullName.toLowerCase().includes(needle),
      );
    }, [roster.data, search]),
  );

  if (role === "TALENT") {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-zinc-600">Anda dapat melihat evaluasi performa milik Anda.</p>
        <p className="text-sm text-zinc-600">
          Gunakan menu Evaluations untuk membuka daftar evaluasi Anda.
        </p>
        <Link
          className="inline-flex w-fit items-center rounded-md bg-tp-brand-navy px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-tp-brand-navy-deep active:bg-tp-brand-navy-deep"
          href={EVALUATIONS_MY}
        >
          Lihat evaluasi saya
        </Link>
      </div>
    );
  }

  if (current.status === "loading" || roster.status === "loading") return <LoadingState />;
  if (current.status === "error")
    return <ErrorState message={current.error ?? "Gagal memuat periode evaluasi."} />;
  if (roster.status === "error")
    return <ErrorState message={roster.error ?? "Gagal memuat roster evaluasi."} />;

  if (!period) {
    return (
      <section className="flex flex-col gap-4">
        <EmptyState message="Belum ada periode evaluasi berjalan. Admin perlu membuat periode evaluasi terlebih dahulu." />
        {role === "ADMIN" ? (
          <p className="text-sm text-zinc-600">
            Buat periode di tab{" "}
            <Link
              className="font-medium text-tp-brand-red-deep hover:underline"
              href={EVALUATION_PERIODS}
            >
              Periode
            </Link>
            .
          </p>
        ) : null}
      </section>
    );
  }

  const entries = roster.data ?? [];
  const evaluated = entries.filter((e) => e.fillState === "EVALUATED").length;
  const readOnly = period.state === "CLOSED" || !canManageEvaluations;

  return (
    <section className="flex flex-col gap-4">
      <div className="rounded-lg border border-board-border bg-board p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">{period.name}</h2>
            <p className="text-sm text-zinc-600">
              {period.startDate} — {period.endDate} · <PeriodStateBadge state={period.state} />
              {readOnly ? " (hanya-baca)" : ""}
            </p>
          </div>
          <div className="text-sm text-zinc-600">
            {evaluated}/{entries.length} talent dinilai
          </div>
        </div>
      </div>

      <TableFilterBar
        search={{
          label: "Cari talent",
          onChange: setSearch,
          placeholder: "Cari nama talent…",
          value: search,
        }}
      />

      <EvaluationsTable
        entries={entries}
        pageRows={pageRows}
        pagination={pagination}
        periodId={period.id}
        readOnly={readOnly}
      />
    </section>
  );
}
