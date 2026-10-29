"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { Table } from "@/components/Table";
import { RowActionsMenu } from "@/components/RowActionsMenu";
import { AssignmentStatusBadge } from "@/features/assignments/AssignmentStatusBadge";
import type { AssignmentRow } from "@/features/assignments/BulkActionBar";
import type { QueryStatus } from "@/lib/apollo/toQueryState";
import { orDash } from "@/lib/cell";
import { ASSIGNMENT_DETAIL } from "@/lib/constants/routes";

type PaginationProps = React.ComponentProps<typeof Table>["pagination"];

export function AssignmentsTable({
  query,
  error,
  data,
  pageRows,
  pagination,
  manage,
  selectedIdSet,
  onToggleRow,
  onToggleAll,
}: {
  query: QueryStatus;
  error: string | null;
  data: readonly AssignmentRow[] | undefined;
  pageRows: readonly AssignmentRow[];
  pagination: PaginationProps;
  manage: boolean;
  selectedIdSet: Set<string>;
  onToggleRow: (row: AssignmentRow, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
}) {
  const router = useRouter();

  if (query === "loading") return <LoadingState />;
  if (query === "error") return <ErrorState message={error ?? "Gagal memuat data."} />;
  if (!data || data.length === 0) {
    return <EmptyState message="Tidak ada assignment yang cocok dengan filter." />;
  }

  return (
    <Table
      caption="Daftar assignment"
      columns={[
        ...(manage
          ? [
              {
                key: "select",
                title: (
                  <input
                    aria-label="Pilih semua baris di halaman ini"
                    checked={
                      pageRows.length > 0 && pageRows.every((row) => selectedIdSet.has(row.id))
                    }
                    className="h-4 w-4"
                    onChange={(e) => onToggleAll(e.target.checked)}
                    type="checkbox"
                  />
                ),
                render: (_value: unknown, assignment: AssignmentRow) => (
                  <input
                    aria-label={`Pilih ${assignment.talent.fullName}`}
                    checked={selectedIdSet.has(assignment.id)}
                    className="h-4 w-4"
                    onChange={(e) => onToggleRow(assignment, e.target.checked)}
                    type="checkbox"
                  />
                ),
              },
            ]
          : []),
        {
          key: "talent",
          title: "Talent",
          render: (_value, assignment) => (
            <>
              <Link
                className="font-medium text-zinc-900 hover:underline"
                href={ASSIGNMENT_DETAIL(assignment.id)}
              >
                {assignment.talent.fullName}
              </Link>
              <span className="block text-xs text-zinc-500">
                {orDash(assignment.talent.nomorInduk)}
              </span>
            </>
          ),
        },
        {
          key: "project",
          title: "Project",
          className: "text-zinc-600",
          render: (_value, assignment) => orDash(assignment.project.name),
        },
        {
          key: "periode",
          title: "Periode",
          className: "text-zinc-600",
          render: (_value, assignment) => (
            <>
              {assignment.periodStart} — {assignment.periodEnd ?? "sekarang"}
            </>
          ),
        },
        {
          key: "status",
          title: "Status",
          render: (_value, assignment) => <AssignmentStatusBadge status={assignment.status} />,
        },
        {
          key: "actions",
          title: "Aksi",
          className: "col-action",
          render: (_value, assignment) => (
            <RowActionsMenu
              actions={[
                {
                  label: "Lihat detail",
                  onSelect: () => router.push(ASSIGNMENT_DETAIL(assignment.id)),
                },
              ]}
              label={`Aksi ${assignment.talent.fullName}`}
            />
          ),
        },
      ]}
      dataSource={pageRows}
      pagination={pagination}
      rowKey={(assignment) => assignment.id}
    />
  );
}
