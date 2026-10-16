"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { BoardTable, type Column } from "@/components/BoardTable";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { FilterButton } from "@/components/FilterButton";
import { Input } from "@/components/Input";
import { PageHeader } from "@/components/PageHeader";
import { Pagination, useTablePagination } from "@/components/Pagination";
import { RowActionsMenu } from "@/components/RowActionsMenu";
import { Select } from "@/components/Select";
import { useAssignableTalents, useEmployees } from "@/features/employees/useEmployees";
import { useMyEmployeeId } from "@/features/employees/useMyEmployee";
import { EMPLOYEE_STATUS_LABEL, EMPLOYEE_STATUS_VARIANT } from "@/features/employees/labels";
import { useUnits } from "@/features/master-data/useMasterData";
import type { EmployeeStatus } from "@/generated/graphql/types";
import { orDash } from "@/lib/cell";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { useSessionRole } from "@/lib/auth/guard";
import { canManage } from "@/lib/auth/matrix";
import { EMPLOYEE_NEW, EMPLOYEE_DETAIL } from "@/lib/constants/routes";

type EmployeeRowData = {
  id: string;
  fullName: string;
  nikMasked: string;
  email: string;
  status: EmployeeStatus;
  nomorInduk: string | null;
  unit: { name: string } | null;
  jobRole: { name: string } | null;
};

const COLUMNS: Column[] = [
  { key: "name", label: "Nama" },
  { key: "nik", label: "NIK" },
  { key: "email", label: "Email" },
  { key: "unit", label: "Divisi" },
  { key: "jobRole", label: "Job Role" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Aksi", className: "col-action" },
];

function EmployeeRow({ employee }: { employee: EmployeeRowData }) {
  const router = useRouter();
  return (
    <tr className="border-b border-board-border transition-colors hover:bg-zinc-50">
      <td className="px-4 py-2.5">
        <Link
          href={EMPLOYEE_DETAIL(employee.id)}
          className="font-medium text-zinc-900 hover:underline"
        >
          {employee.fullName}
        </Link>
        <span className="block text-xs text-zinc-500">{orDash(employee.nomorInduk)}</span>
      </td>
      <td className="px-4 py-2.5 font-mono text-xs text-zinc-600">{orDash(employee.nikMasked)}</td>
      <td className="px-4 py-2.5 text-zinc-600">{orDash(employee.email)}</td>
      <td className="px-4 py-2.5 text-zinc-600">{orDash(employee.unit?.name)}</td>
      <td className="px-4 py-2.5 text-zinc-600">{orDash(employee.jobRole?.name)}</td>
      <td className="px-4 py-2.5">
        <Chip variant={EMPLOYEE_STATUS_VARIANT[employee.status]} size="small">
          {EMPLOYEE_STATUS_LABEL[employee.status]}
        </Chip>
      </td>
      <td className="col-action">
        <RowActionsMenu
          label={`Aksi ${employee.fullName}`}
          actions={[
            {
              label: "Lihat detail",
              onSelect: () => router.push(EMPLOYEE_DETAIL(employee.id)),
            },
          ]}
        />
      </td>
    </tr>
  );
}

export default function EmployeesPage() {
  const role = useSessionRole();
  if (role === "TALENT") return <OwnEmployeeRedirect />;
  if (role === "CHAPTER") return <ChapterTalentList />;
  return <EmployeeDirectory manage={canManage(role, "employees")} />;
}

function OwnEmployeeRedirect() {
  const router = useRouter();
  const { status, data, error } = useMyEmployeeId();

  React.useEffect(() => {
    if (data) router.replace(EMPLOYEE_DETAIL(data));
  }, [data, router]);

  if (status === "error") return <ErrorState message={error ?? "Gagal memuat data."} />;
  if (status === "ready" && data === null)
    return <EmptyState message="Akun Anda belum tertaut ke data karyawan." />;
  return <LoadingState />;
}

function ChapterTalentList() {
  const router = useRouter();
  const { status, data, error } = useAssignableTalents();

  return (
    <section className="flex flex-col gap-4">
      <PageHeader
        title="Data Karyawan"
        subtitle="Talent dalam cakupan chapter Anda yang siap ditugaskan (hanya baca)."
      />
      {status === "loading" ? (
        <LoadingState />
      ) : status === "error" ? (
        <ErrorState message={error ?? "Gagal memuat data."} />
      ) : !data || data.length === 0 ? (
        <EmptyState message="Belum ada talent dalam cakupan chapter Anda." />
      ) : (
        <BoardTable
          caption="Talent dalam cakupan chapter"
          columns={[
            { key: "name", label: "Nama" },
            { key: "nomorInduk", label: "Nomor Induk" },
            { key: "actions", label: "Aksi", className: "col-action" },
          ]}
        >
          {data.map((talent) => (
            <tr key={talent.id} className="border-b border-board-border transition-colors hover:bg-zinc-50">
              <td className="px-4 py-2.5">
                <Link href={EMPLOYEE_DETAIL(talent.id)} className="font-medium text-zinc-900 hover:underline">
                  {talent.fullName}
                </Link>
              </td>
              <td className="px-4 py-2.5 text-zinc-600">{orDash(talent.nomorInduk)}</td>
              <td className="col-action">
                <RowActionsMenu
                  label={`Aksi ${talent.fullName}`}
                  actions={[
                    {
                      label: "Lihat detail",
                      onSelect: () => router.push(EMPLOYEE_DETAIL(talent.id)),
                    },
                  ]}
                />
              </td>
            </tr>
          ))}
        </BoardTable>
      )}
    </section>
  );
}

function EmployeeDirectory({ manage }: { manage: boolean }) {
  const [searchInput, setSearchInput] = React.useState("");
  const search = useDebouncedValue(searchInput);
  const [unitId, setUnitId] = React.useState("");
  const [status, setStatus] = React.useState<EmployeeStatus | "ALL">("ALL");
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  // The chosen page size drives the query's first (API default 25, speckit §5).
  const [pageSize, setPageSize] = React.useState(25);
  const units = useUnits();
  const {
    status: query,
    employees,
    totalCount,
    hasNextPage,
    loadingMore,
    stalled,
    error,
    loadMore,
    reload,
  } = useEmployees(
    {
      search: search || undefined,
      unitId: unitId || undefined,
      status: status === "ALL" ? undefined : status,
    },
    pageSize
  );
  const activeFilters = (unitId ? 1 : 0) + (status !== "ALL" ? 1 : 0);
  const { pageRows, pagination, resetPage } = useTablePagination(employees, {
    totalItems: totalCount,
    pageSize,
    onPageSizeChange: setPageSize,
    hasMore: hasNextPage,
    loadingMore,
    loadMore,
  });
  const hintFrom = (pagination.page - 1) * pagination.pageSize + 1;
  const hintTo = Math.min(pagination.page * pagination.pageSize, totalCount);

  return (
    <section className="flex flex-col gap-4">
      <PageHeader
        title="Data Karyawan"
        subtitle={
          manage
            ? "Kelola data karyawan, pencarian, dan filter."
            : "Data karyawan untuk konteks penautan akun (hanya baca)."
        }
        actions={
          manage ? (
            <Link href={EMPLOYEE_NEW} className="no-underline">
              <Button variant="primary">+ Tambah Karyawan</Button>
            </Link>
          ) : undefined
        }
        search={
          <label className="flex w-full max-w-xs items-center gap-2 text-sm text-zinc-700">
            <span className="sr-only">Cari karyawan</span>
            <Input
              type="search"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                resetPage();
              }}
              placeholder="Cari nama, email, atau nomor induk…"
            />
          </label>
        }
        filters={
          <FilterButton
            activeCount={activeFilters}
            expanded={filtersOpen}
            onClick={() => setFiltersOpen((open) => !open)}
            panelId="employee-filter-panel"
          />
        }
      />

      {filtersOpen ? (
        <div id="employee-filter-panel" className="tp-card flex flex-wrap items-end gap-4">
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <span>Divisi</span>
            <Select
              value={unitId}
              onChange={(e) => {
                setUnitId(e.target.value);
                resetPage();
              }}
              className="w-auto"
              options={[
                { value: "", label: "Semua" },
                ...(units.data ?? []).map((unit) => ({ value: unit.id, label: unit.name })),
              ]}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <span>Status</span>
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as EmployeeStatus | "ALL");
                resetPage();
              }}
              className="w-auto"
              options={[
                { value: "ALL", label: "Semua" },
                ...(Object.keys(EMPLOYEE_STATUS_LABEL) as Array<
                  keyof typeof EMPLOYEE_STATUS_LABEL
                >).map((value) => ({ value, label: EMPLOYEE_STATUS_LABEL[value] })),
              ]}
            />
          </label>
        </div>
      ) : null}

      {stalled && query === "ready" ? (
        <div className="tp-card flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm text-amber-800">
          <span>Sebagian data belum berhasil dimuat dari server.</span>
          <Button
            variant="secondary"
            onClick={() => {
              reload();
              resetPage();
            }}
          >
            Muat ulang
          </Button>
        </div>
      ) : null}

      {query === "loading" ? (
        <LoadingState />
      ) : query === "error" ? (
        <ErrorState message={error ?? "Gagal memuat data."} />
      ) : !employees || employees.length === 0 ? (
        <EmptyState message="Tidak ada karyawan yang cocok dengan pencarian/filter." />
      ) : (
        <BoardTable caption="Daftar karyawan" columns={COLUMNS} footer={<Pagination {...pagination} />}>
          {pageRows.map((employee) => (
            <EmployeeRow key={employee.id} employee={employee} />
          ))}
          {loadingMore && pageRows.length === 0 ? (
            <tr>
              <td colSpan={COLUMNS.length} className="px-4 py-6 text-center text-sm text-zinc-500">
                Memuat baris {hintFrom}–{hintTo} dari {totalCount}…
              </td>
            </tr>
          ) : null}
        </BoardTable>
      )}
    </section>
  );
}
