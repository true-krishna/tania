"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { Table } from "@/components/Table";
import { useTablePagination } from "@/components/Pagination";
import { RowActionsMenu } from "@/components/RowActionsMenu";
import { useCurrentEvaluationPeriod } from "@/features/evaluations/useCurrentEvaluationPeriod";
import { useEvaluationRoster } from "@/features/evaluations/useEvaluationRoster";
import {
  FillStateBadge,
  PeriodStateBadge,
} from "@/features/evaluations/EvaluationBadges";
import { orDash } from "@/lib/cell";
import { useSessionRole } from "@/lib/auth/guard";
import { canManage } from "@/lib/auth/matrix";
import {
  EVALUATIONS_MY,
  EVALUATION_PERIODS,
  EVALUATION_DETAIL,
} from "@/lib/constants/routes";

export default function EvaluationsPage() {
  const role = useSessionRole();
  const router = useRouter();
  const current = useCurrentEvaluationPeriod();
  const roster = useEvaluationRoster(current.data?.id ?? null);
  const period = current.data;
  const { pageRows, pagination } = useTablePagination(roster.data);

  if (role === "TALENT") {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-zinc-600">
          Anda dapat melihat evaluasi performa milik Anda.
        </p>
        <p className="text-sm text-zinc-600">Gunakan menu Evaluations untuk membuka daftar evaluasi Anda.</p>
        <Link
          className="inline-flex w-fit items-center rounded-md bg-tp-brand-navy px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-tp-brand-navy-deep active:bg-tp-brand-navy-deep"
          href={EVALUATIONS_MY}
        >
          Lihat evaluasi saya
        </Link>
      </div>
    );
  }

  if (current.status === "loading" || roster.status === "loading")
    return <LoadingState />;
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
            <Link className="font-medium text-tp-brand-red-deep hover:underline" href={EVALUATION_PERIODS}>
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
  const readOnly = period.state === "CLOSED" || !canManage(role, "evaluations");

  return (
    <section className="flex flex-col gap-4">
      <div className="rounded-lg border border-board-border bg-board p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">{period.name}</h2>
            <p className="text-sm text-zinc-600">
              {period.startDate} — {period.endDate} ·{" "}
              <PeriodStateBadge state={period.state} />
              {readOnly ? " (hanya-baca)" : ""}
            </p>
          </div>
          <div className="text-sm text-zinc-600">
            {evaluated}/{entries.length} talent dinilai
          </div>
        </div>
      </div>

      {entries.length === 0 ? (
        <EmptyState message="Tidak ada talent dalam cakupan chapter untuk periode ini." />
      ) : (
        <Table
          caption="Roster evaluasi periode"
          columns={[
            {
              key: "talent",
              title: "Talent",
              render: (_value, entry) => (
                <>
                  <span className="text-sm font-medium text-zinc-900">
                    {entry.talent.fullName}
                  </span>
                  <span className="ml-2 text-xs text-zinc-400">
                    {orDash(entry.talent.nomorInduk)}
                  </span>
                </>
              ),
            },
            {
              key: "jobRole",
              title: "Job Role",
              className: "text-zinc-600",
              render: (_value, entry) => orDash(entry.talent.jobRole?.name),
            },
            {
              key: "status",
              title: "Status",
              render: (_value, entry) => <FillStateBadge fillState={entry.fillState} />,
            },
            {
              key: "actions",
              title: "Aksi",
              className: "col-action",
              render: (_value, entry) => {
                const already = entry.fillState === "EVALUATED";
                return (
                  <RowActionsMenu
                    actions={[
                      {
                        label: readOnly ? "Lihat" : already ? "Nilai ulang" : "Nilai",
                        onSelect: () =>
                          router.push(EVALUATION_DETAIL(period.id, entry.talent.id)),
                      },
                    ]}
                    label={`Aksi ${entry.talent.fullName}`}
                  />
                );
              },
            },
          ]}
          dataSource={pageRows}
          pagination={pagination}
          rowKey={(entry) => entry.talent.id}
        />
      )}
    </section>
  );
}