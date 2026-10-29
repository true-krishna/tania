"use client";

import type * as React from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/DataState";
import { Table } from "@/components/Table";
import { RowActionsMenu } from "@/components/RowActionsMenu";
import { FillStateBadge } from "@/features/evaluations/FillStateBadge";
import { orDash } from "@/lib/cell";
import { EVALUATION_DETAIL } from "@/lib/constants/routes";

type EvaluationEntry = {
  talent: {
    id: string;
    fullName: string;
    nomorInduk: string | null;
    jobRole: { name: string } | null;
  };
  fillState: "EVALUATED" | "NOT_EVALUATED";
};

type RosterPagination = React.ComponentProps<typeof Table>["pagination"];

function actionLabel(readOnly: boolean, alreadyEvaluated: boolean): string {
  if (readOnly) return "Lihat";
  if (alreadyEvaluated) return "Nilai ulang";
  return "Nilai";
}

export function EvaluationsTable({
  entries,
  pageRows,
  pagination,
  periodId,
  readOnly,
}: {
  entries: readonly EvaluationEntry[];
  pageRows: readonly EvaluationEntry[];
  pagination: RosterPagination;
  periodId: string;
  readOnly: boolean;
}) {
  const router = useRouter();

  if (entries.length === 0) {
    return <EmptyState message="Tidak ada talent dalam cakupan chapter untuk periode ini." />;
  }
  if (pageRows.length === 0) {
    return <p className="text-sm text-tp-muted">Tidak ada talent yang cocok dengan pencarian.</p>;
  }

  return (
    <Table
      caption="Roster evaluasi periode"
      columns={[
        {
          key: "talent",
          title: "Talent",
          render: (_value, entry) => (
            <>
              <span className="text-sm font-medium text-zinc-900">{entry.talent.fullName}</span>
              <span className="ml-2 text-xs text-zinc-400">{orDash(entry.talent.nomorInduk)}</span>
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
                    label: actionLabel(readOnly, already),
                    onSelect: () => router.push(EVALUATION_DETAIL(periodId, entry.talent.id)),
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
  );
}
