"use client";

import * as React from "react";
import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { useTablePagination } from "@/components/Pagination";
import { TableFilterBar } from "@/components/TableFilterBar";
import { BulkActionBar, type AssignmentRow } from "@/features/assignments/BulkActionBar";
import { BulkCreateAssignmentModal } from "@/features/assignments/BulkCreateAssignmentModal";
import { CreateAssignmentModal } from "@/features/assignments/CreateAssignmentModal";
import { TalentOptions } from "@/features/assignments/TalentOptions";
import { useAssignments } from "@/features/assignments/useAssignments";
import { useProjects } from "@/features/master-data/useMasterData";
import type { AccessRole, AssignmentFilter, AssignmentStatus } from "@/generated/graphql/types";
import { useModuleAccess } from "@/lib/auth/access";
import { useSessionRole } from "@/lib/auth/guard";
import { AssignmentsTable } from "./AssignmentsTable";

const SUBTITLE: Partial<Record<AccessRole, string>> = {
  CHAPTER: "Kelola penugasan talent ke project dalam chapter Anda.",
  OPERATION: "Lihat seluruh penugasan talent (hanya baca).",
  ADMIN: "Kelola seluruh penugasan talent (TAN-212 clarify 4).",
  TALENT: "Riwayat penugasan Anda.",
};

export default function AssignmentsPage() {
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

      <AssignmentsTable
        data={data}
        error={error}
        manage={manage}
        onToggleAll={toggleAllRows}
        onToggleRow={toggleRow}
        pageRows={pageRows}
        pagination={pagination}
        query={query}
        selectedIdSet={selectedIdSet}
      />

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
