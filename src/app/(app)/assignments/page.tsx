"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { EmptyState, ErrorState, LoadingState, StatusBadge } from "@/components/DataState";
import { BoardTable } from "@/components/BoardTable";
import { Button } from "@/components/Button";
import { FilterButton } from "@/components/FilterButton";
import { PageHeader } from "@/components/PageHeader";
import { Pagination, useTablePagination } from "@/components/Pagination";
import { RowActionsMenu } from "@/components/RowActionsMenu";
import { Select } from "@/components/Select";
import { useAssignments } from "@/features/assignments/useAssignments";
import { useAssignableTalents, useEmployees } from "@/features/employees/useEmployees";
import { useProjects } from "@/features/master-data/useMasterData";
import type { AccessRole, AssignmentStatus } from "@/generated/graphql/types";
import { orDash } from "@/lib/cell";
import { useSessionRole } from "@/lib/auth/guard";
import { canManage } from "@/lib/auth/matrix";
import { ASSIGNMENT_NEW, ASSIGNMENT_DETAIL } from "@/lib/constants/routes";

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
  const router = useRouter();
  return (
    <tr className="border-b border-board-border transition-colors hover:bg-zinc-50">
      <td className="px-4 py-2.5">
        <Link
          href={ASSIGNMENT_DETAIL(assignment.id)}
          className="font-medium text-zinc-900 hover:underline"
        >
          {assignment.talent.fullName}
        </Link>
        <span className="block text-xs text-zinc-500">{orDash(assignment.talent.nomorInduk)}</span>
      </td>
      <td className="px-4 py-2.5 text-zinc-600">{orDash(assignment.project.name)}</td>
      <td className="px-4 py-2.5 text-zinc-600">{orDash(assignment.jobRole.name)}</td>
      <td className="px-4 py-2.5 text-zinc-600">
        {assignment.periodStart} — {assignment.periodEnd ?? "sekarang"}
      </td>
      <td className="px-4 py-2.5">
        <StatusBadge active={assignment.status === "ACTIVE"} />
      </td>
      <td className="col-action">
        <RowActionsMenu
          label={`Aksi ${assignment.talent.fullName}`}
          actions={[
            {
              label: "Lihat detail",
              onSelect: () => router.push(ASSIGNMENT_DETAIL(assignment.id)),
            },
          ]}
        />
      </td>
    </tr>
  );
}

const SUBTITLE: Partial<Record<AccessRole, string>> = {
  CHAPTER: "Kelola penugasan talent ke project dalam chapter Anda.",
  OPERATION: "Lihat seluruh penugasan talent (hanya baca).",
  ADMIN: "Kelola seluruh penugasan talent (TAN-212 clarify 4).",
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
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        options={[
          { value: "", label: "Semua" },
          ...options.map((emp) => ({ value: emp.id, label: emp.fullName })),
        ]}
      />
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
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const { status: query, data, error } = useAssignments({
    employeeId: talentId || undefined,
    projectId: projectId || undefined,
    status: status === "ALL" ? undefined : status,
  });
  const projects = useProjects();
  const activeFilters =
    (talentId ? 1 : 0) + (projectId ? 1 : 0) + (status !== "ALL" ? 1 : 0);
  const { pageRows, pagination, resetPage } = useTablePagination(data);

  return (
    <section className="flex flex-col gap-4">
      <PageHeader
        title="Assignments"
        subtitle={(role && SUBTITLE[role]) ?? "Penugasan talent ke project."}
        actions={
          manage ? (
            <Link href={ASSIGNMENT_NEW} className="no-underline">
              <Button variant="primary">+ Buat Assignment</Button>
            </Link>
          ) : undefined
        }
        filters={
          <FilterButton
            activeCount={activeFilters}
            expanded={filtersOpen}
            onClick={() => setFiltersOpen((open) => !open)}
            panelId="assignment-filter-panel"
          />
        }
      />

      {filtersOpen ? (
        <div id="assignment-filter-panel" className="tp-card flex flex-wrap items-end gap-4">
          {ownOnly ? null : (
            <TalentFilter
              value={talentId}
              onChange={(value) => {
                setTalentId(value);
                resetPage();
              }}
            />
          )}
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <span>Project</span>
            <Select
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                resetPage();
              }}
              options={[
                { value: "", label: "Semua" },
                ...(projects.data ?? []).map((p) => ({ value: p.id, label: p.name })),
              ]}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <span>Status</span>
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as AssignmentStatus | "ALL");
                resetPage();
              }}
              options={[
                { value: "ALL", label: "Semua" },
                { value: "ACTIVE", label: "Aktif" },
                { value: "COMPLETED", label: "Selesai" },
              ]}
            />
          </label>
        </div>
      ) : null}

      {query === "loading" ? (
        <LoadingState />
      ) : query === "error" ? (
        <ErrorState message={error ?? "Gagal memuat data."} />
      ) : !data || data.length === 0 ? (
        <EmptyState message="Tidak ada assignment yang cocok dengan filter." />
      ) : (
        <>
          <BoardTable
            caption="Daftar assignment"
            columns={[
              { key: "talent", label: "Talent" },
              { key: "project", label: "Project" },
              { key: "jobRole", label: "Job Role" },
              { key: "periode", label: "Periode" },
              { key: "status", label: "Status" },
              { key: "actions", label: "Aksi", className: "col-action" },
            ]}
            footer={<Pagination {...pagination} />}
          >
            {pageRows.map((assignment) => (
              <AssignmentRow key={assignment.id} assignment={assignment} />
            ))}
          </BoardTable>
        </>
      )}
    </section>
  );
}