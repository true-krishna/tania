"use client";

import * as React from "react";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/DataState";
import { Table } from "@/components/Table";
import { TableFilterBar } from "@/components/TableFilterBar";
import { AssignmentStatusBadge } from "@/features/assignments/AssignmentStatusBadge";
import { HanyaBacaChip } from "@/features/workload/HanyaBacaChip";
import type { ProfileAssignment } from "./useProfile";

export function AssignmentsSection({ assignments }: { assignments: readonly ProfileAssignment[] }) {
  const [search, setSearch] = React.useState("");
  const visible = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return assignments;
    return assignments.filter((assignment) =>
      assignment.project.name.toLowerCase().includes(needle),
    );
  }, [assignments, search]);

  if (assignments.length === 0) {
    return <EmptyState message="Belum ada assignment tercatat." />;
  }

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-tp-text">Riwayat assignment</h2>
        <HanyaBacaChip />
      </div>
      <TableFilterBar
        search={{
          label: "Cari assignment",
          onChange: setSearch,
          placeholder: "Cari nama project…",
          value: search,
        }}
      />
      {visible.length === 0 ? (
        <p className="text-sm text-tp-muted">Tidak ada assignment yang cocok dengan pencarian.</p>
      ) : (
        <Card className="min-w-0 max-w-3xl" padded={false}>
          <Table
            caption="Riwayat assignment saya"
            columns={[
              {
                key: "project",
                title: "Project",
                className: "font-medium text-tp-text",
                render: (_value, assignment) => assignment.project.name,
              },
              {
                key: "periode",
                title: "Periode",
                className: "text-tp-muted",
                render: (_value, assignment) => (
                  <>
                    {assignment.periodStart} — {assignment.periodEnd ?? "sekarang"}
                  </>
                ),
              },
              {
                key: "status",
                title: "Status",
                render: (_value, assignment) => (
                  <AssignmentStatusBadge status={assignment.status} />
                ),
              },
            ]}
            dataSource={visible}
            rowKey={(assignment) => assignment.id}
          />
        </Card>
      )}
    </div>
  );
}
