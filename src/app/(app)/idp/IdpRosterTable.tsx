"use client";

import type * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { Chip } from "@/components/Chip";
import { Table } from "@/components/Table";
import { RowActionsMenu } from "@/components/RowActionsMenu";
import { IDP_STATUS_LABEL, IDP_STATUS_VARIANT } from "@/features/idp/labels";
import type { IdpStatus } from "@/generated/graphql/types";
import type { QueryStatus } from "@/lib/apollo/toQueryState";
import { orDash } from "@/lib/cell";
import { IDP_DETAIL } from "@/lib/constants/routes";

export type IdpListRow = {
  id: string;
  status: IdpStatus;
  developmentObjective: string;
  timelineStart: string;
  timelineEnd: string;
  talent: { fullName: string; nomorInduk: string | null };
  actions: Array<{ id: string; status: string }>;
};

type IdpPagination = React.ComponentProps<typeof Table>["pagination"];

function actionProgress(row: IdpListRow) {
  const total = row.actions.length;
  const done = row.actions.filter((a) => a.status === "COMPLETED").length;
  const donePct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, donePct };
}

export function IdpRosterTable({
  query,
  error,
  data,
  pageRows,
  pagination,
}: {
  query: QueryStatus;
  error: string | null;
  data: readonly IdpListRow[] | undefined;
  pageRows: readonly IdpListRow[];
  pagination: IdpPagination;
}) {
  const router = useRouter();

  if (query === "loading") return <LoadingState />;
  if (query === "error") return <ErrorState message={error ?? "Gagal memuat data."} />;
  if (!data || data.length === 0) {
    return <EmptyState message="Tidak ada IDP yang cocok dengan filter." />;
  }

  return (
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
              <span className="ml-2 text-xs text-zinc-400">{orDash(idp.talent.nomorInduk)}</span>
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
  );
}
