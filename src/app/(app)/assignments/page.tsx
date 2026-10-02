"use client";

import Link from "next/link";
import * as React from "react";
import { EmptyState, ErrorState, LoadingState, StatusBadge } from "@/components/DataState";
import { BoardTable } from "@/components/BoardTable";
import { PageHeader } from "@/components/PageHeader";
import { Select } from "@/components/Select";
import { assignments } from "@/features/assignments/mock";
import { useAssignments } from "@/features/assignments/useAssignments";
import { employees } from "@/features/employees/mock";
import { projects } from "@/features/master-data/mock";
import type { Assignment, AssignmentStatus } from "@/generated/graphql/types";

function AssignmentRow({ assignment }: { assignment: Assignment }) {
  return (
    <tr className="border-b border-board-border transition-colors hover:bg-zinc-50">
      <td className="px-4 py-2.5">
        <Link
          href={`/assignments/${assignment.id}`}
          className="font-medium text-zinc-900 hover:underline"
        >
          {assignment.talent.fullName}
        </Link>
        <span className="block text-xs text-zinc-500">{assignment.talent.employeeCode}</span>
      </td>
      <td className="px-4 py-2.5 text-zinc-600">{assignment.project.name}</td>
      <td className="px-4 py-2.5 text-zinc-600">{assignment.jobRole.name}</td>
      <td className="px-4 py-2.5 text-zinc-600">
        {assignment.periodStart} — {assignment.periodEnd ?? "sekarang"}
      </td>
      <td className="px-4 py-2.5">
        <StatusBadge active={assignment.status === "ACTIVE"} />
      </td>
    </tr>
  );
}

export default function AssignmentsPage() {
  const [talentId, setTalentId] = React.useState("");
  const [projectId, setProjectId] = React.useState("");
  const [status, setStatus] = React.useState<AssignmentStatus | "ALL">("ALL");
  const { status: query, data, error } = useAssignments({
    employeeId: talentId || undefined,
    projectId: projectId || undefined,
    status: status === "ALL" ? undefined : status,
  });

  return (
    <section className="flex flex-col gap-4">
      <PageHeader
        title="Assignments"
        subtitle="Kelola penugasan talent ke project (Chapter)."
        actions={
          <Link
            href="/assignments/new"
            className="inline-flex items-center rounded-md bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
          >
            + Buat Assignment
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <span>Talent</span>
          <Select value={talentId} onChange={(e) => setTalentId(e.target.value)}>
            <option value="">Semua</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.fullName}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <span>Project</span>
          <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">Semua</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <span>Status</span>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as AssignmentStatus | "ALL")}
          >
            <option value="ALL">Semua</option>
            <option value="ACTIVE">Aktif</option>
            <option value="COMPLETED">Selesai</option>
          </Select>
        </label>
      </div>

      {query === "loading" ? (
        <LoadingState />
      ) : query === "error" ? (
        <ErrorState message={error ?? "Gagal memuat data."} />
      ) : !data || data.length === 0 ? (
        <EmptyState message="Tidak ada assignment yang cocok dengan filter." />
      ) : (
        <BoardTable
          caption="Daftar assignment"
          columns={[
            { key: "talent", label: "Talent" },
            { key: "project", label: "Project" },
            { key: "jobRole", label: "Job Role" },
            { key: "periode", label: "Periode" },
            { key: "status", label: "Status" },
          ]}
        >
          {data.map((assignment) => (
            <AssignmentRow key={assignment.id} assignment={assignment} />
          ))}
        </BoardTable>
      )}
      <p className="text-xs text-zinc-500">
        {data ? `${data.length} dari ${assignments.length} assignment ditampilkan.` : ""}
      </p>
    </section>
  );
}