"use client";

import { EditAssignmentForm } from "./EditAssignmentForm";
import { EndAssignmentCard } from "./EndAssignmentCard";
import type { AssignmentNode } from "./types";

export function AssignmentActions({
  assignment,
  manage,
}: {
  assignment: AssignmentNode;
  manage: boolean;
}) {
  if (assignment.status !== "ACTIVE") {
    return (
      <p className="w-fit rounded-full bg-tp-tint-info px-4 py-1.5 text-sm text-tp-ink-info">
        Assignment selesai.
      </p>
    );
  }

  if (!manage) return null;

  return (
    <>
      <EditAssignmentForm assignment={assignment} />
      <EndAssignmentCard assignment={assignment} />
    </>
  );
}
