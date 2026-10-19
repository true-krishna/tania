"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { Table } from "@/components/Table";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { FilterButton } from "@/components/FilterButton";
import { PageHeader } from "@/components/PageHeader";
import { useTablePagination } from "@/components/Pagination";
import { RowActionsMenu } from "@/components/RowActionsMenu";
import { Select } from "@/components/Select";
import { IDP_STATUS_LABEL, IDP_STATUS_VARIANT } from "@/features/idp/labels";
import { MyIdpView } from "@/features/idp/MyIdpView";
import { useIdps } from "@/features/idp/useIdps";
import { useSessionRole } from "@/lib/auth/guard";
import { canManage } from "@/lib/auth/matrix";
import { orDash } from "@/lib/cell";
import { IDP_NEW, IDP_DETAIL } from "@/lib/constants/routes";
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

function actionProgress(row: IdpListRow) {
  const total = row.actions.length;
  const done = row.actions.filter((a) => a.status === "COMPLETED").length;
  const donePct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, donePct };
}

/**
 * `/idp` — the IDP menu entry, open for every role since the 2026-10-16
 * activation (klarifikasi 9); only what it opens differs:
 * - CHAPTER / ADMIN: manage (create, actions, review, close) — Chapter scoped to
 *   its chapter, Admin company-wide;
 * - OPERATION: read-only roster;
 * - TALENT: its own plan (`MyIdpView`), no roster scope.
 */
export default function IdpPage() {
  const role = useSessionRole();
  if (role === "TALENT") return <MyIdpView />;
  return <IdpRosterView managing={canManage(role, "idp")} />;
}

function IdpRosterView({ managing }: { managing: boolean }) {
  const router = useRouter();
  const [status, setStatus] = React.useState<IdpStatus | "ALL">("ALL");
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const { status: query, data, error } = useIdps({
    status: status === "ALL" ? undefined : status,
  });
  const { pageRows, pagination, resetPage } = useTablePagination(data);

  return (
    <section className="flex flex-col gap-4">
      <PageHeader
        title="IDP"
        subtitle={
          managing
            ? "Kelola Individual Development Plan talent dalam chapter Anda."
            : "Individual Development Plan talent (hanya baca)."
        }
        actions={
          managing ? (
            <Link href={IDP_NEW} className="no-underline">
              <Button variant="primary">+ Buat IDP</Button>
            </Link>
          ) : undefined
        }
        filters={
          <FilterButton
            activeCount={status !== "ALL" ? 1 : 0}
            expanded={filtersOpen}
            onClick={() => setFiltersOpen((open) => !open)}
            panelId="idp-filter-panel"
          />
        }
      />

      {filtersOpen ? (
        <div id="idp-filter-panel" className="tp-card flex flex-wrap items-end gap-4">
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <span>Status</span>
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as IdpStatus | "ALL");
                resetPage();
              }}
              options={[
                { value: "ALL", label: "Semua" },
                { value: "IN_PROGRESS", label: "Berjalan" },
                { value: "NEEDS_REVIEW", label: "Perlu review" },
                { value: "COMPLETED", label: "Selesai" },
              ]}
            />
          </label>
        </div>
      ) : null}

      {query === "loading" ? (
        <LoadingState />
      ) : query === "error" ? (
        <ErrorState message={error ?? "Gagal memuat data."} />
      ) : !data || data.length === 0 ? (
        <EmptyState message="Tidak ada IDP yang cocok dengan filter." />
      ) : (
        <Table
          caption="Daftar IDP"
          rowKey={(idp) => idp.id}
          dataSource={pageRows}
          pagination={pagination}
          columns={[
            {
              key: "talent",
              title: "Talent",
              render: (_value, idp) => (
                <>
                  <Link
                    href={IDP_DETAIL(idp.id)}
                    className="text-sm font-medium text-tp-brand-red-deep hover:underline"
                  >
                    {idp.talent.fullName}
                  </Link>
                  <span className="ml-2 text-xs text-zinc-400">
                    {orDash(idp.talent.nomorInduk)}
                  </span>
                </>
              ),
            },
            {
              key: "objective",
              title: "Development Objective",
              className: "text-zinc-600",
              render: (_value, idp) => orDash(idp.developmentObjective),
            },
            {
              key: "timeline",
              title: "Timeline",
              className: "text-zinc-600",
              render: (_value, idp) => (
                <>
                  {idp.timelineStart} — {idp.timelineEnd}
                </>
              ),
            },
            {
              key: "progress",
              title: "Progres Aksi",
              render: (_value, idp, index) => {
                const { total, done, donePct } = actionProgress(idp);
                return (
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
                );
              },
            },
            {
              key: "status",
              title: "Status",
              render: (_value, idp) => (
                <Chip variant={IDP_STATUS_VARIANT[idp.status]} size="small">
                  {IDP_STATUS_LABEL[idp.status]}
                </Chip>
              ),
            },
            {
              key: "actions",
              title: "Aksi",
              className: "col-action",
              render: (_value, idp) => (
                <RowActionsMenu
                  label={`Aksi ${idp.talent.fullName}`}
                  actions={[
                    {
                      label: "Lihat detail",
                      onSelect: () => router.push(IDP_DETAIL(idp.id)),
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      )}
    </section>
  );
}