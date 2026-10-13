"use client";

import Link from "next/link";
import * as React from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { BoardTable } from "@/components/BoardTable";
import { PageHeader } from "@/components/PageHeader";
import { Pagination, useTablePagination } from "@/components/Pagination";
import { Select } from "@/components/Select";
import { useIdps } from "@/features/idp/useIdps";
import { cn } from "@/lib/cn";
import type { IdpStatus } from "@/generated/graphql/types";

type IdpListRow = {
  id: string;
  status: IdpStatus;
  developmentObjective: string;
  timelineStart: string;
  timelineEnd: string;
  talent: { fullName: string; nomorInduk: string | null };
  actions: Array<{ id: string; status: string }>;
};

const STATUS_LABEL: Record<IdpStatus, string> = {
  IN_PROGRESS: "Berjalan",
  NEEDS_REVIEW: "Perlu review",
  COMPLETED: "Selesai",
};

function actionProgress(row: IdpListRow) {
  const total = row.actions.length;
  const done = row.actions.filter((a) => a.status === "COMPLETED").length;
  const donePct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, donePct };
}

function IdpRow({ idp, index }: { idp: IdpListRow; index: number }) {
  const { total, done, donePct } = actionProgress(idp);
  return (
    <tr className="border-b border-board-border transition-colors hover:bg-zinc-50">
      <td className="px-4 py-2.5">
        <Link href={`/idp/${idp.id}`} className="text-sm font-medium text-tp-brand-red-deep hover:underline">
          {idp.talent.fullName}
        </Link>
        <span className="ml-2 text-xs text-zinc-400">{idp.talent.nomorInduk ?? "—"}</span>
      </td>
      <td className="px-4 py-2.5 text-zinc-600">{idp.developmentObjective}</td>
      <td className="px-4 py-2.5 text-zinc-600">
        {idp.timelineStart} — {idp.timelineEnd}
      </td>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-600">
            {done}/{total}
          </span>
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-zinc-200">
            <div
              className="h-full rounded-full bg-tp-neutral"
              style={{ width: `${donePct}%` }}
              role="progressbar"
              aria-valuenow={donePct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={index === 0 ? "Progres aksi" : undefined}
            />
          </div>
        </div>
      </td>
      <td className="px-4 py-2.5">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold",
            idp.status === "COMPLETED" && "bg-green-100 text-green-700",
            idp.status === "NEEDS_REVIEW" && "bg-amber-100 text-amber-700",
            idp.status === "IN_PROGRESS" && "bg-tp-tint-info text-tp-ink-info",
          )}
        >
          {STATUS_LABEL[idp.status]}
        </span>
      </td>
    </tr>
  );
}

export default function IdpPage() {
  const [status, setStatus] = React.useState<IdpStatus | "ALL">("ALL");
  const { status: query, data, error } = useIdps({
    status: status === "ALL" ? undefined : status,
  });
  const { pageRows, pagination, resetPage } = useTablePagination(data);

  return (
    <section className="flex flex-col gap-4">
      <PageHeader
        title="IDP"
        subtitle="Kelola Individual Development Plan talent dalam chapter Anda."
        actions={
          <Link
            href="/idp/new"
            className="inline-flex items-center rounded-md bg-tp-brand-navy px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-tp-brand-navy-deep active:bg-tp-brand-navy-deep"
          >
            + Buat IDP
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <span>Status</span>
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as IdpStatus | "ALL");
              resetPage();
            }}
          >
            <option value="ALL">Semua</option>
            <option value="IN_PROGRESS">Berjalan</option>
            <option value="NEEDS_REVIEW">Perlu review</option>
            <option value="COMPLETED">Selesai</option>
          </Select>
        </label>
      </div>

      {query === "loading" ? (
        <LoadingState />
      ) : query === "error" ? (
        <ErrorState message={error ?? "Gagal memuat data."} />
      ) : !data || data.length === 0 ? (
        <EmptyState message="Tidak ada IDP yang cocok dengan filter." />
      ) : (
        <>
          <BoardTable
            caption="Daftar IDP"
            columns={[
              { key: "talent", label: "Talent" },
              { key: "objective", label: "Development Objective" },
              { key: "timeline", label: "Timeline" },
              { key: "progress", label: "Progres Aksi" },
              { key: "status", label: "Status" },
            ]}
            footer={<Pagination {...pagination} />}
          >
            {pageRows.map((idp, index) => (
              <IdpRow key={idp.id} idp={idp} index={index} />
            ))}
          </BoardTable>
        </>
      )}
    </section>
  );
}