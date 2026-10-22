import { EmptyState } from "@/components/DataState";
import { AssignmentStatusBadge } from "@/features/assignments/AssignmentStatusBadge";
import { Table } from "@/components/Table";
import { Card } from "@/components/Card";
import type { ProfileAssignment } from "./useProfile";

export function AssignmentsSection({
  assignments,
}: {
  assignments: readonly ProfileAssignment[];
}) {
  if (assignments.length === 0) {
    return <EmptyState message="Belum ada assignment tercatat." />;
  }

  return (
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
        dataSource={assignments}
        rowKey={(assignment) => assignment.id}
      />
    </Card>
  );
}
