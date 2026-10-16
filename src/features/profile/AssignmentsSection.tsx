import { EmptyState, StatusBadge } from "@/components/DataState";
import { Table } from "@/components/Table";
import { Card } from "@/components/Card";
import type { ProfileAssignment } from "./useProfile";

/**
 * Assignment section of `/profile` (TAN-188) — the user's own placements,
 * newest first (server-ordered), read-only.
 */
export function AssignmentsSection({
  assignments,
}: {
  assignments: readonly ProfileAssignment[];
}) {
  if (assignments.length === 0) {
    return <EmptyState message="Belum ada assignment tercatat." />;
  }

  return (
    <Card padded={false} className="max-w-3xl">
      <Table
        caption="Riwayat assignment saya"
        rowKey={(assignment) => assignment.id}
        dataSource={assignments}
        columns={[
          {
            key: "project",
            title: "Project",
            className: "font-medium text-zinc-900",
            render: (_value, assignment) => assignment.project.name,
          },
          {
            key: "jobRole",
            title: "Job Role",
            className: "text-zinc-600",
            render: (_value, assignment) => assignment.jobRole.name,
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
              <StatusBadge active={assignment.status === "ACTIVE"} />
            ),
          },
        ]}
      />
    </Card>
  );
}
