"use client";

import Link from "next/link";
import * as React from "react";
import { EmptyState, ErrorState, LoadingState, StatusBadge } from "@/components/DataState";
import { assignments } from "@/features/assignments/mock";
import { useAssignments } from "@/features/assignments/useAssignments";
import { employees } from "@/features/employees/mock";
import { projects } from "@/features/master-data/mock";
import type { Assignment, AssignmentStatus } from "@/generated/graphql/types";

function AssignmentRow({ assignment }: { assignment: Assignment }) {
  return (
    <tr className="border-b border-zinc-100">
      <td className="py-2 pr-4">
        <Link
          href={`/assignments/${assignment.id}`}
          className="font-medium text-zinc-900 hover:underline"
        >
          {assignment.talent.fullName}
        </Link>
        <span className="block text-xs text-zinc-500">{assignment.talent.employeeCode}</span>
      </td>
      <td className="py-2 pr-4 text-zinc-600">{assignment.project.name}</td>
      <td className="py-2 pr-4 text-zinc-600">{assignment.jobRole.name}</td>
      <td className="py-2 pr-4 text-zinc-600">
        {assignment.periodStart} — {assignment.periodEnd ?? "sekarang"}
      </td>
      <td className="py-2">
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
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Assignments</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Kelola penugasan talent ke project (Chapter).
          </p>
        </div>
        <Link
          href="/assignments/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          + Buat Assignment
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <span>Talent</span>
          <select
            value={talentId}
            onChange={(e) => setTalentId(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="">Semua</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.fullName}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <span>Project</span>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="">Semua</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <span>Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as AssignmentStatus | "ALL")}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="ALL">Semua</option>
            <option value="ACTIVE">Aktif</option>
            <option value="COMPLETED">Selesai</option>
          </select>
        </label>
      </div>

      {query === "loading" ? (
        <LoadingState />
      ) : query === "error" ? (
        <ErrorState message={error ?? "Gagal memuat data."} />
      ) : !data || data.length === 0 ? (
        <EmptyState message="Tidak ada assignment yang cocok dengan filter." />
      ) : (
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">Daftar assignment</caption>
          <thead>
            <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
              <th scope="col" className="py-2 pr-4 font-medium">
                Talent
              </th>
              <th scope="col" className="py-2 pr-4 font-medium">
                Project
              </th>
              <th scope="col" className="py-2 pr-4 font-medium">
                Job Role
              </th>
              <th scope="col" className="py-2 pr-4 font-medium">
                Periode
              </th>
              <th scope="col" className="py-2 font-medium">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((assignment) => (
              <AssignmentRow key={assignment.id} assignment={assignment} />
            ))}
          </tbody>
        </table>
      )}
      <p className="text-xs text-zinc-500">
        {data ? `${data.length} dari ${assignments.length} assignment ditampilkan.` : ""}
      </p>
    </section>
  );
}