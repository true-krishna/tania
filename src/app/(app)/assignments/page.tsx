"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { AssignmentStatusBadge } from "@/features/assignments/AssignmentStatusBadge";
import { CreateAssignmentModal } from "@/features/assignments/CreateAssignmentModal";
import { Table } from "@/components/Table";
import { Button } from "@/components/Button";
import { FilterButton } from "@/components/FilterButton";
import { PageHeader } from "@/components/PageHeader";
import { useTablePagination } from "@/components/Pagination";
import { RowActionsMenu } from "@/components/RowActionsMenu";
import { Select } from "@/components/Select";
import { useAssignments } from "@/features/assignments/useAssignments";
import { useAssignableTalents, useEmployees } from "@/features/employees/useEmployees";
import { useProjects } from "@/features/master-data/useMasterData";
import type { AccessRole, AssignmentStatus } from "@/generated/graphql/types";
import { orDash } from "@/lib/cell";
import { useSessionRole } from "@/lib/auth/guard";
import { canManage } from "@/lib/auth/matrix";
import { ASSIGNMENT_DETAIL } from "@/lib/constants/routes";

const SUBTITLE: Partial<Record<AccessRole, string>> = {
  CHAPTER: "Kelola penugasan talent ke project dalam chapter Anda.",
  OPERATION: "Lihat seluruh penugasan talent (hanya baca).",
  ADMIN: "Kelola seluruh penugasan talent (TAN-212 clarify 4).",
  TALENT: "Riwayat penugasan Anda.",
};

function TalentFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const role = useSessionRole();
  return role === "CHAPTER" ? (
    <ChapterTalentOptions onChange={onChange} value={value} />
  ) : (
    <EmployeeTalentOptions onChange={onChange} value={value} />
  );
}

function EmployeeTalentOptions({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const employees = useEmployees();
  return <TalentSelect onChange={onChange} options={employees.employees ?? []} value={value} />;
}

function ChapterTalentOptions({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const talents = useAssignableTalents();
  return <TalentSelect onChange={onChange} options={talents.data ?? []} value={value} />;
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
        onChange={(e) => onChange(e.target.value)}
        options={[
          { value: "", label: "Semua" },
          ...options.map((emp) => ({ value: emp.id, label: emp.fullName })),
        ]}
        value={value}
      />
    </label>
  );
}

export default function AssignmentsPage() {
  const router = useRouter();
  const role = useSessionRole();
  const manage = canManage(role, "assignments");
  const ownOnly = role === "TALENT";
  const [talentId, setTalentId] = React.useState("");
  const [projectId, setProjectId] = React.useState("");
  const [status, setStatus] = React.useState<AssignmentStatus | "ALL">("ALL");
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
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
        actions={
          manage ? (
            <Button onClick={() => setCreateOpen(true)} variant="primary">
              + Buat Assignment
            </Button>
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
        subtitle={(role && SUBTITLE[role]) ?? "Penugasan talent ke project."}
        title="Assignments"
      />

      {filtersOpen ? (
        <div className="tp-card flex flex-wrap items-end gap-4" id="assignment-filter-panel">
          {ownOnly ? null : (
            <TalentFilter
              onChange={(value) => {
                setTalentId(value);
                resetPage();
              }}
              value={talentId}
            />
          )}
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <span>Project</span>
            <Select
              onChange={(e) => {
                setProjectId(e.target.value);
                resetPage();
              }}
              options={[
                { value: "", label: "Semua" },
                ...(projects.data ?? []).map((p) => ({ value: p.id, label: p.name })),
              ]}
              value={projectId}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <span>Status</span>
            <Select
              onChange={(e) => {
                setStatus(e.target.value as AssignmentStatus | "ALL");
                resetPage();
              }}
              options={[
                { value: "ALL", label: "Semua" },
                { value: "ACTIVE", label: "Berjalan" },
                { value: "COMPLETED", label: "Selesai" },
              ]}
              value={status}
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
        <Table
          caption="Daftar assignment"
          columns={[
            {
              key: "talent",
              title: "Talent",
              render: (_value, assignment) => (
                <>
                  <Link
                    className="font-medium text-zinc-900 hover:underline"
                    href={ASSIGNMENT_DETAIL(assignment.id)}
                  >
                    {assignment.talent.fullName}
                  </Link>
                  <span className="block text-xs text-zinc-500">
                    {orDash(assignment.talent.nomorInduk)}
                  </span>
                </>
              ),
            },
            {
              key: "project",
              title: "Project",
              className: "text-zinc-600",
              render: (_value, assignment) => orDash(assignment.project.name),
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
            {
              key: "actions",
              title: "Aksi",
              className: "col-action",
              render: (_value, assignment) => (
                <RowActionsMenu
                  actions={[
                    {
                      label: "Lihat detail",
                      onSelect: () => router.push(ASSIGNMENT_DETAIL(assignment.id)),
                    },
                  ]}
                  label={`Aksi ${assignment.talent.fullName}`}
                />
              ),
            },
          ]}
          dataSource={pageRows}
          pagination={pagination}
           rowKey={(assignment) => assignment.id}
         />
       )}

       {manage && createOpen ? (
         <CreateAssignmentModal
           onClose={() => setCreateOpen(false)}
           onCreated={() => {
             resetPage();
           }}
           open={createOpen}
         />
       ) : null}
     </section>
   );
 }
