"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { BoardTable } from "@/components/BoardTable";
import { Pagination, useTablePagination } from "@/components/Pagination";
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

/**
 * Evaluations home — US7 roster, open to Admin, Operation and Chapter since the
 * 2026-10-16 activation (klarifikasi 9). Rooted on the current/selected
 * evaluation period; shows every talent in the chapter's scope with an
 * NOT_EVALUATED/EVALUATED flag (FR-28). The period must be RUNNING *and* the
 * role must manage (Chapter scoped, Admin company-wide) to score; Operation
 * reads the roster, and a CLOSED period is read-only for everyone.
 */
export default function EvaluationsPage() {
  const role = useSessionRole();
  const router = useRouter();
  const current = useCurrentEvaluationPeriod();
  const roster = useEvaluationRoster(current.data?.id ?? null);
  const period = current.data;
  const { pageRows, pagination } = useTablePagination(roster.data);

  // Talent lands on their read-only view; Chapter/Admin see the roster.
  if (role === "TALENT") {
    // Lazy-import is overkill for a demo route; the Talent view lives at
    // /evaluations/my. For a direct hit on /evaluations show a pointer.
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-zinc-600">
          Anda dapat melihat evaluasi performa milik Anda.
        </p>
        <p className="text-sm text-zinc-600">Gunakan menu Evaluations untuk membuka daftar evaluasi Anda.</p>
        <Link
          href={EVALUATIONS_MY}
          className="inline-flex w-fit items-center rounded-md bg-tp-brand-navy px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-tp-brand-navy-deep active:bg-tp-brand-navy-deep"
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
            <Link href={EVALUATION_PERIODS} className="font-medium text-tp-brand-red-deep hover:underline">
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
        <>
          <BoardTable
            caption="Roster evaluasi periode"
            columns={[
              { key: "talent", label: "Talent" },
              { key: "jobRole", label: "Job Role" },
              { key: "status", label: "Status" },
              { key: "actions", label: "Aksi", className: "col-action" },
            ]}
            footer={<Pagination {...pagination} />}
          >
            {pageRows.map((entry) => {
              const already = entry.fillState === "EVALUATED";
              return (
                <tr key={entry.talent.id} className="border-b border-board-border transition-colors hover:bg-zinc-50">
                  <td className="px-4 py-2.5">
                    <span className="text-sm font-medium text-zinc-900">{entry.talent.fullName}</span>
                    <span className="ml-2 text-xs text-zinc-400">{orDash(entry.talent.nomorInduk)}</span>
                  </td>
                  <td className="px-4 py-2.5 text-zinc-600">{orDash(entry.talent.jobRole?.name)}</td>
                  <td className="px-4 py-2.5">
                    <FillStateBadge fillState={entry.fillState} />
                  </td>
                  <td className="col-action">
                    <RowActionsMenu
                      label={`Aksi ${entry.talent.fullName}`}
                      actions={[
                        {
                          label: readOnly ? "Lihat" : already ? "Nilai ulang" : "Nilai",
                          onSelect: () =>
                            router.push(EVALUATION_DETAIL(period.id, entry.talent.id)),
                        },
                      ]}
                    />
                  </td>
                </tr>
              );
            })}
          </BoardTable>
        </>
      )}
    </section>
  );
}