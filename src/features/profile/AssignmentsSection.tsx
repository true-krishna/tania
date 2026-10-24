"use client";

import * as React from "react";
import { EmptyState } from "@/components/DataState";
import { AssignmentStatusBadge } from "@/features/assignments/AssignmentStatusBadge";
import { Table } from "@/components/Table";
import { Card } from "@/components/Card";
import { TableFilterBar } from "@/components/TableFilterBar";
import type { ProfileAssignment } from "./useProfile";

export function AssignmentsSection({
  assignments,
}: {
  assignments: readonly ProfileAssignment[];
}) {
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
    <div className="flex flex-col gap-3">
      <TableFilterBar
        search={{
          label: "Cari assignment",
          onChange: setSearch,
          placeholder: "Cari nama project…",
          value: search,
        }}
      />
      {visible.length === 0 ? (
        <p className="text-sm text-tp-muted">
          Tidak ada assignment yang cocok dengan pencarian.
        </p>
      ) : (
        <Card className="max-w-3xl" padded={false}>
          <Table
            caption="Riwayat assignment saya"
        columns={[
          {
            key: "project",
            title: "Project",
            className: "font-medium text-zinc-900",
            render: (_value, assignment) => assignment.project.name,
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
