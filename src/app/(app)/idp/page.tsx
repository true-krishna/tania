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
        actions={
          managing ? (
            <Link className="no-underline" href={IDP_NEW}>
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
        subtitle={
          managing
            ? "Kelola Individual Development Plan talent dalam chapter Anda."
            : "Individual Development Plan talent (hanya baca)."
        }
        title="IDP"
      />

      {filtersOpen ? (
        <div className="tp-card flex flex-wrap items-end gap-4" id="idp-filter-panel">
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <span>Status</span>
            <Select
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
              value={status}
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
          columns={[
            {
              key: "talent",
              title: "Talent",
              render: (_value, idp) => (
                <>
                  <Link
                    className="text-sm font-medium text-tp-brand-red-deep hover:underline"
                    href={IDP_DETAIL(idp.id)}
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
                        aria-label={index === 0 ? "Progres aksi" : undefined}
                        aria-valuemax={100}
                        aria-valuemin={0}
                        aria-valuenow={donePct}
                        className="h-full rounded-full bg-tp-neutral"
                        role="progressbar"
                        style={{ width: `${donePct}%` }}
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
                <Chip size="small" variant={IDP_STATUS_VARIANT[idp.status]}>
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
                  actions={[
                    {
                      label: "Lihat detail",
                      onSelect: () => router.push(IDP_DETAIL(idp.id)),
                    },
                  ]}
                  label={`Aksi ${idp.talent.fullName}`}
                />
              ),
            },
          ]}
          dataSource={pageRows}
          pagination={pagination}
          rowKey={(idp) => idp.id}
        />
      )}
    </section>
  );
}