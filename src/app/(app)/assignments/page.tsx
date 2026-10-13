"use client";

import Link from "next/link";
import * as React from "react";
import { EmptyState, ErrorState, LoadingState, StatusBadge } from "@/components/DataState";
import { BoardTable } from "@/components/BoardTable";
import { PageHeader } from "@/components/PageHeader";
import { Select } from "@/components/Select";
import { useAssignments } from "@/features/assignments/useAssignments";
import { useAssignableTalents, useEmployees } from "@/features/employees/useEmployees";
import { useProjects } from "@/features/master-data/useMasterData";
import type { AccessRole, AssignmentStatus } from "@/generated/graphql/types";
import { useSessionRole } from "@/lib/auth/guard";
import { canManage } from "@/lib/auth/matrix";

type AssignmentRowData = {
  id: string;
  status: AssignmentStatus;
  periodStart: string;
  periodEnd: string | null;
  talent: { fullName: string; nomorInduk: string | null };
  project: { name: string };
  jobRole: { name: string };
};

function AssignmentRow({ assignment }: { assignment: AssignmentRowData }) {
  return (
    <tr className="border-b border-board-border transition-colors hover:bg-zinc-50">
      <td className="px-4 py-2.5">
        <Link
          href={`/assignments/${assignment.id}`}
          className="font-medium text-zinc-900 hover:underline"
        >
          {assignment.talent.fullName}
        </Link>
        <span className="block text-xs text-zinc-500">{assignment.talent.nomorInduk ?? "—"}</span>
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

const SUBTITLE: Partial<Record<AccessRole, string>> = {
  CHAPTER: "Kelola penugasan talent ke project dalam chapter Anda.",
  OPERATION: "Lihat seluruh penugasan talent (hanya baca).",
  TALENT: "Riwayat penugasan Anda.",
};

function TalentFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const role = useSessionRole();
  return role === "CHAPTER" ? (
    <ChapterTalentOptions value={value} onChange={onChange} />
  ) : (
    <EmployeeTalentOptions value={value} onChange={onChange} />
  );
}

function EmployeeTalentOptions({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const employees = useEmployees();
  return <TalentSelect value={value} onChange={onChange} options={employees.employees ?? []} />;
}

function ChapterTalentOptions({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const talents = useAssignableTalents();
  return <TalentSelect value={value} onChange={onChange} options={talents.data ?? []} />;
}

function TalentSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: ReadonlyArray<{ id: string; fullName: string }>;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-zinc-700">
      <span>Talent</span>
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Semua</option>
        {options.map((emp) => (
          <option key={emp.id} value={emp.id}>
            {emp.fullName}
          </option>
        ))}
      </Select>
    </label>
  );
}

export default function AssignmentsPage() {
  const role = useSessionRole();
  const manage = canManage(role, "assignments");
  const ownOnly = role === "TALENT";
  const [talentId, setTalentId] = React.useState("");
  const [projectId, setProjectId] = React.useState("");
  const [status, setStatus] = React.useState<AssignmentStatus | "ALL">("ALL");
  const { status: query, data, error } = useAssignments({
    employeeId: talentId || undefined,
    projectId: projectId || undefined,
    status: status === "ALL" ? undefined : status,
  });
  const projects = useProjects();

  return (
    <section className="flex flex-col gap-4">
      <PageHeader
        title="Assignments"
        subtitle={(role && SUBTITLE[role]) ?? "Penugasan talent ke project."}
        actions={
          manage ? (
            <Link
              href="/assignments/new"
              className="inline-flex items-center rounded-md bg-tp-brand-navy px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-tp-brand-navy-deep active:bg-tp-brand-navy-deep"
            >
              + Buat Assignment
            </Link>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        {ownOnly ? null : <TalentFilter value={talentId} onChange={setTalentId} />}
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <span>Project</span>
          <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">Semua</option>
            {projects.data?.map((p) => (
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
        {data ? `${data.length} assignment ditampilkan.` : ""}
      </p>
    </section>
  );
}