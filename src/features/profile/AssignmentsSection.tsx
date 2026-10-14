import { EmptyState, StatusBadge } from "@/components/DataState";
import { BoardTable } from "@/components/BoardTable";
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
      <BoardTable
        caption="Riwayat assignment saya"
        columns={[
          { key: "project", label: "Project" },
          { key: "jobRole", label: "Job Role" },
          { key: "periode", label: "Periode" },
          { key: "status", label: "Status" },
        ]}
      >
        {assignments.map((assignment) => (
          <tr key={assignment.id} className="border-b border-board-border last:border-b-0">
            <td className="px-4 py-2.5 font-medium text-zinc-900">{assignment.project.name}</td>
            <td className="px-4 py-2.5 text-zinc-600">{assignment.jobRole.name}</td>
            <td className="px-4 py-2.5 text-zinc-600">
              {assignment.periodStart} — {assignment.periodEnd ?? "sekarang"}
            </td>
            <td className="px-4 py-2.5">
              <StatusBadge active={assignment.status === "ACTIVE"} />
            </td>
          </tr>
        ))}
      </BoardTable>
    </Card>
  );
}