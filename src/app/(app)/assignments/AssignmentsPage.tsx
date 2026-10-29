"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { AssignmentStatusBadge } from "@/features/assignments/AssignmentStatusBadge";
import { BulkActionBar, type AssignmentRow } from "@/features/assignments/BulkActionBar";
import { BulkCreateAssignmentModal } from "@/features/assignments/BulkCreateAssignmentModal";
import { CreateAssignmentModal } from "@/features/assignments/CreateAssignmentModal";
import { Table } from "@/components/Table";
import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { useTablePagination } from "@/components/Pagination";
import { RowActionsMenu } from "@/components/RowActionsMenu";
import { Select } from "@/components/Select";
import { TableFilterBar } from "@/components/TableFilterBar";
import { useAssignments } from "@/features/assignments/useAssignments";
import { useAssignableTalents, useEmployees } from "@/features/employees/useEmployees";
import { useProjects } from "@/features/master-data/useMasterData";
import type { AccessRole, AssignmentFilter, AssignmentStatus } from "@/generated/graphql/types";
import { orDash } from "@/lib/cell";
import { useModuleAccess } from "@/lib/auth/access";
import { useSessionRole } from "@/lib/auth/guard";
import { ASSIGNMENT_DETAIL } from "@/lib/constants/routes";

const SUBTITLE: Partial<Record<AccessRole, string>> = {
  CHAPTER: "Kelola penugasan talent ke project dalam chapter Anda.",
  OPERATION: "Lihat seluruh penugasan talent (hanya baca).",
  ADMIN: "Kelola seluruh penugasan talent (TAN-212 clarify 4).",
  TALENT: "Riwayat penugasan Anda.",
};

function TalentOptions({
  labelledBy,
  value,
  onChange,
}: {
  labelledBy?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const role = useSessionRole();
  return role === "CHAPTER" ? (
    <ChapterTalentOptions labelledBy={labelledBy} onChange={onChange} value={value} />
  ) : (
    <EmployeeTalentOptions labelledBy={labelledBy} onChange={onChange} value={value} />
  );
}

function EmployeeTalentOptions({
  labelledBy,
  value,
  onChange,
}: {
  labelledBy?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const employees = useEmployees();
  return (
    <Select
      aria-labelledby={labelledBy}
      className="w-64"
      onChange={(e) => onChange(e.target.value)}
      options={[
        { value: "", label: "Semua" },
        ...(employees.employees ?? []).map((emp) => ({ value: emp.id, label: emp.fullName })),
      ]}
      value={value}
    />
  );
}

function ChapterTalentOptions({
  labelledBy,
  value,
  onChange,
}: {
  labelledBy?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const talents = useAssignableTalents();
  return (
    <Select
      aria-labelledby={labelledBy}
      className="w-64"
      onChange={(e) => onChange(e.target.value)}
      options={[
        { value: "", label: "Semua" },
        ...(talents.data ?? []).map((emp) => ({ value: emp.id, label: emp.fullName })),
      ]}
      value={value}
    />
  );
}

export default function AssignmentsPage() {
  const router = useRouter();
  const role = useSessionRole();
  const manage = useModuleAccess("assignments").canManage;
  const ownOnly = role === "TALENT";
  const [filters, setFilters] = React.useState<{
    talentId: string;
    projectId: string;
    status: string;
  }>({ talentId: "", projectId: "", status: "" });
  const [createOpen, setCreateOpen] = React.useState(false);
  const [bulkCreateOpen, setBulkCreateOpen] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const filter: AssignmentFilter = {
    employeeId: filters.talentId || undefined,
    projectId: filters.projectId || undefined,
    status: (filters.status || undefined) as AssignmentStatus | undefined,
  };
  const { status: query, data, error } = useAssignments(filter);
  const projects = useProjects();
  const { pageRows, pagination, resetPage } = useTablePagination(data);
  const selectedIdSet = new Set(selectedIds);
  const selectedRows: AssignmentRow[] = (data ?? []).filter((row) => selectedIdSet.has(row.id));

  function toggleRow(row: AssignmentRow, checked: boolean) {
    setSelectedIds((prev) =>
      checked && !prev.includes(row.id) ? [...prev, row.id] : prev.filter((id) => id !== row.id),
    );
  }

  function toggleAllRows(checked: boolean) {
    const pageIds = pageRows.map((row) => row.id);
    setSelectedIds((prev) =>
      checked
        ? Array.from(new Set([...prev, ...pageIds]))
        : prev.filter((id) => !pageIds.includes(id)),
    );
  }

  const talentField = {
    key: "talentId",
    label: "Talent",
    render: (context: {
      labelledBy?: string;
      onChange: (value: string) => void;
      value: string;
    }) => (
      <TalentOptions
        labelledBy={context.labelledBy}
        onChange={context.onChange}
        value={context.value}
      />
    ),
    type: "custom" as const,
  };
  const fields = [
    ...(ownOnly ? [] : [talentField]),
    {
      key: "projectId",
      label: "Project",
      options: [
        { value: "", label: "Semua" },
        ...(projects.data ?? []).map((p) => ({ value: p.id, label: p.name })),
      ],
      type: "select" as const,
    },
    {
      key: "status",
      label: "Status",
      options: [
        { value: "", label: "Semua" },
        { value: "ACTIVE", label: "Berjalan" },
        { value: "COMPLETED", label: "Selesai" },
      ],
      type: "select" as const,
    },
  ];

  function changeFilter(key: string, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    resetPage();
    setSelectedIds([]);
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  return (
    <section className="flex flex-col gap-4">
      <PageHeader
        actions={
          manage ? (
            <div className="flex gap-2">
              <Button onClick={() => setBulkCreateOpen(true)} variant="secondary">
                + Buat Massal
              </Button>
              <Button onClick={() => setCreateOpen(true)} variant="primary">
                + Buat Assignment
              </Button>
            </div>
          ) : undefined
        }
        subtitle={(role && SUBTITLE[role]) ?? "Penugasan talent ke project."}
        title="Assignments"
      />

      <TableFilterBar fields={fields} onChange={changeFilter} values={filters} />

      {manage && selectedRows.length > 0 ? (
        <BulkActionBar onClear={clearSelection} onDone={resetPage} rows={selectedRows} />
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
            ...(manage
              ? [
                  {
                    key: "select",
                    title: (
                      <input
                        aria-label="Pilih semua baris di halaman ini"
                        checked={
                          pageRows.length > 0 && pageRows.every((row) => selectedIdSet.has(row.id))
                        }
                        className="h-4 w-4"
                        onChange={(e) => toggleAllRows(e.target.checked)}
                        type="checkbox"
                      />
                    ),
                    render: (_value: unknown, assignment: AssignmentRow) => (
                      <input
                        aria-label={`Pilih ${assignment.talent.fullName}`}
                        checked={selectedIdSet.has(assignment.id)}
                        className="h-4 w-4"
                        onChange={(e) => toggleRow(assignment, e.target.checked)}
                        type="checkbox"
                      />
                    ),
                  },
                ]
              : []),
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
              render: (_value, assignment) => <AssignmentStatusBadge status={assignment.status} />,
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

      {manage ? (
        <>
          <BulkCreateAssignmentModal
            onClose={() => setBulkCreateOpen(false)}
            onCreated={resetPage}
            open={bulkCreateOpen}
          />
          <CreateAssignmentModal
            onClose={() => setCreateOpen(false)}
            onCreated={() => {
              resetPage();
            }}
            open={createOpen}
          />
        </>
      ) : null}
    </section>
  );
}
