"use client";

import type * as React from "react";
import { EmptyState, StatusBadge } from "@/components/DataState";
import { Table } from "@/components/Table";
import { PeriodStateBadge } from "@/features/evaluations/PeriodStateBadge";
import type { EvaluationPeriodsQuery } from "@/generated/graphql";

type PeriodRow = EvaluationPeriodsQuery["evaluationPeriods"][number];

type PeriodPagination = React.ComponentProps<typeof Table>["pagination"];

export function EvaluationPeriodsTable({
  isEmpty,
  visiblePeriods,
  pageRows,
  pagination,
}: {
  isEmpty: boolean;
  visiblePeriods: readonly PeriodRow[];
  pageRows: readonly PeriodRow[];
  pagination: PeriodPagination;
}) {
  if (isEmpty) {
    return <EmptyState message="Belum ada periode evaluasi. Buat periode pertama." />;
  }
  if (visiblePeriods.length === 0) {
    return <p className="text-sm text-tp-muted">Tidak ada periode yang cocok dengan pencarian.</p>;
  }

  return (
    <Table
      caption="Daftar periode evaluasi"
      columns={[
        {
          key: "name",
          title: "Nama",
          className: "text-zinc-900",
          render: (_value, period) => period.name,
        },
        {
          key: "range",
          title: "Rentang",
          className: "text-zinc-600",
          render: (_value, period) => (
            <>
              {period.startDate} — {period.endDate}
            </>
          ),
        },
        {
          key: "template",
          title: "Template",
          className: "text-zinc-600",
          render: (_value, period) => period.template.name,
        },
        {
          key: "state",
          title: "State",
          render: (_value, period) => <PeriodStateBadge state={period.state} />,
        },
        {
          key: "status",
          title: "Status",
          render: (_value, period) => <StatusBadge active={period.isActive} />,
        },
      ]}
      dataSource={pageRows}
      pagination={pagination}
      rowKey={(period) => period.id}
    />
  );
}
