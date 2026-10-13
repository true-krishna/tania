"use client";

import Link from "next/link";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { BoardTable } from "@/components/BoardTable";
import { useCurrentEvaluationPeriod } from "@/features/evaluations/useCurrentEvaluationPeriod";
import { useEvaluationRoster } from "@/features/evaluations/useEvaluationRoster";
import {
  FillStateBadge,
  PeriodStateBadge,
} from "@/features/evaluations/EvaluationBadges";
import { useSessionRole } from "@/lib/auth/guard";

/**
 * Evaluations home (Chapter & Admin) — US7 roster.
 * Rooted on the current/selected evaluation period; shows every talent in the
 * chapter's scope with an NOT_EVALUATED/EVALUATED flag (FR-28). The period must
 * be RUNNING for the chapter to score; a CLOSED period is read-only.
 */
export default function EvaluationsPage() {
  const role = useSessionRole();
  const current = useCurrentEvaluationPeriod();
  const roster = useEvaluationRoster(current.data?.id ?? null);
  const period = current.data;

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
          href="/evaluations/my"
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
            <Link href="/evaluations/periods" className="font-medium text-tp-brand-red-deep hover:underline">
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
  const readOnly = period.state === "CLOSED";

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
        <BoardTable
          caption="Roster evaluasi periode"
          columns={[
            { key: "talent", label: "Talent" },
            { key: "jobRole", label: "Job Role" },
            { key: "status", label: "Status" },
            { key: "action", label: "" },
          ]}
        >
          {entries.map((entry) => {
            const already = entry.fillState === "EVALUATED";
            return (
              <tr key={entry.talent.id} className="border-b border-board-border transition-colors hover:bg-zinc-50">
                <td className="px-4 py-2.5">
                  <span className="text-sm font-medium text-zinc-900">{entry.talent.fullName}</span>
                  <span className="ml-2 text-xs text-zinc-400">{entry.talent.nomorInduk ?? "—"}</span>
                </td>
                <td className="px-4 py-2.5 text-zinc-600">{entry.talent.jobRole?.name ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <FillStateBadge fillState={entry.fillState} />
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Link
                    href={`/evaluations/${period.id}/${entry.talent.id}`}
                    className="inline-flex items-center rounded-md border border-tp-brand-red/20 bg-tp-brand-red/5 px-3 py-1 text-xs font-medium text-tp-brand-red-deep shadow-sm hover:bg-tp-brand-red/10"
                  >
                    {readOnly ? "Lihat" : already ? "Nilai ulang" : "Nilai"}
                  </Link>
                </td>
              </tr>
            );
          })}
        </BoardTable>
      )}
      <p className="text-xs text-zinc-500">{entries.length} talent ditampilkan.</p>
    </section>
  );
}