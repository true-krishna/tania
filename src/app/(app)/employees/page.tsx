"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { Table } from "@/components/Table";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { PageHeader } from "@/components/PageHeader";
import { useTablePagination } from "@/components/Pagination";
import { RowActionsMenu } from "@/components/RowActionsMenu";
import { TableFilterBar } from "@/components/TableFilterBar";
import { ToastProvider } from "@/components/Toast/Toast";
import { useAssignableTalents, useEmployees } from "@/features/employees/useEmployees";
import { useMyEmployeeId } from "@/features/employees/useMyEmployee";
import { EMPLOYEE_STATUS_LABEL, EMPLOYEE_STATUS_VARIANT } from "@/features/employees/labels";
import { EmployeeFormModal } from "@/features/employees/EmployeeFormModal";
import { useChapters, useUnits } from "@/features/master-data/useMasterData";
import type { EmployeeStatus } from "@/generated/graphql/types";
import { orDash } from "@/lib/cell";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { useSessionRole } from "@/lib/auth/guard";
import { canManage } from "@/lib/auth/matrix";
import { EMPLOYEE_DETAIL } from "@/lib/constants/routes";

export default function EmployeesPage() {
  const role = useSessionRole();
  if (role === "TALENT") return <OwnEmployeeRedirect />;
  if (role === "CHAPTER") return <ChapterTalentList />;
  return (
    <ToastProvider>
      <EmployeeDirectory manage={canManage(role, "employees")} />
    </ToastProvider>
  );
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
        subtitle="Talent dalam cakupan chapter Anda yang siap ditugaskan (hanya baca)."
        title="Data Karyawan"
      />
      {status === "loading" ? (
        <LoadingState />
      ) : status === "error" ? (
        <ErrorState message={error ?? "Gagal memuat data."} />
      ) : !data || data.length === 0 ? (
        <EmptyState message="Belum ada talent dalam cakupan chapter Anda." />
      ) : (
        <Table
          caption="Talent dalam cakupan chapter"
          columns={[
            {
              key: "name",
              title: "Nama",
              render: (_value, talent) => (
                <Link
                  className="font-medium text-zinc-900 hover:underline"
                  href={EMPLOYEE_DETAIL(talent.id)}
                >
                  {talent.fullName}
                </Link>
              ),
            },
            {
              key: "nomorInduk",
              title: "Nomor Induk",
              className: "text-zinc-600",
              render: (_value, talent) => orDash(talent.nomorInduk),
            },
            {
              key: "actions",
              title: "Aksi",
              className: "col-action",
              render: (_value, talent) => (
                <RowActionsMenu
                  actions={[
                    {
                      label: "Lihat detail",
                      onSelect: () => router.push(EMPLOYEE_DETAIL(talent.id)),
                    },
                  ]}
                  label={`Aksi ${talent.fullName}`}
                />
              ),
            },
          ]}
          dataSource={data}
          rowKey={(talent) => talent.id}
        />
      )}
    </section>
  );
}

function EmployeeDirectory({ manage }: { manage: boolean }) {
  const router = useRouter();
  const [searchInput, setSearchInput] = React.useState("");
  const search = useDebouncedValue(searchInput);
  const [filters, setFilters] = React.useState<{ chapterId: string; status: string; unitId: string }>({
    chapterId: "",
    status: "",
    unitId: "",
  });
  const [pageSize, setPageSize] = React.useState(25);
  const [modalMode, setModalMode] = React.useState<"create" | "edit" | null>(null);
  const [editEmployeeId, setEditEmployeeId] = React.useState<string | null>(null);
  const units = useUnits();
  const chapters = useChapters();
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
      unitId: filters.unitId || undefined,
      chapterId: filters.chapterId || undefined,
      status: (filters.status || undefined) as EmployeeStatus | undefined,
    },
    pageSize
  );
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
  const loadingMoreRow = loadingMore && pageRows.length === 0;

  function changeFilter(key: string, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    resetPage();
  }

  return (
    <section className="flex flex-col gap-4">
      <PageHeader
        actions={
          manage ? (
            <Button onClick={() => setModalMode("create")} variant="primary">
              + Tambah Karyawan
            </Button>
          ) : undefined
        }
        subtitle={
          manage
            ? "Kelola data karyawan, pencarian, dan filter."
            : "Data karyawan untuk konteks penautan akun (hanya baca)."
        }
        title="Data Karyawan"
      />

      <TableFilterBar
        fields={[
          {
            key: "unitId",
            label: "Divisi",
            options: [
              { value: "", label: "Semua" },
              ...(units.data ?? []).map((unit) => ({ value: unit.id, label: unit.name })),
            ],
            type: "select",
          },
          {
            key: "chapterId",
            label: "Chapter",
            options: [
              { value: "", label: "Semua" },
              ...(chapters.data ?? []).map((chapter) => ({ value: chapter.id, label: chapter.name })),
            ],
            type: "select",
          },
          {
            key: "status",
            label: "Status",
            options: [
              { value: "", label: "Semua" },
              ...(Object.keys(EMPLOYEE_STATUS_LABEL) as Array<
                keyof typeof EMPLOYEE_STATUS_LABEL
              >).map((value) => ({ value, label: EMPLOYEE_STATUS_LABEL[value] })),
            ],
            type: "select",
          },
        ]}
        onChange={changeFilter}
        search={{
          label: "Cari karyawan",
          onChange: (value) => {
            setSearchInput(value);
            resetPage();
          },
          placeholder: "Cari nama, email, atau nomor induk…",
          value: searchInput,
        }}
        values={filters}
      />

      {stalled && query === "ready" ? (
        <div className="tp-card flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm text-amber-800">
          <span>Sebagian data belum berhasil dimuat dari server.</span>
          <Button
            onClick={() => {
              reload();
              resetPage();
            }}
            variant="secondary"
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
        <Table
          caption="Daftar karyawan"
          columns={[
            {
              key: "name",
              title: "Nama",
              render: (_value, employee) => (
                <>
                  <Link
                    className="font-medium text-zinc-900 hover:underline"
                    href={EMPLOYEE_DETAIL(employee.id)}
                  >
                    {employee.fullName}
                  </Link>
                  <span className="block text-xs text-zinc-500">{orDash(employee.nomorInduk)}</span>
                </>
              ),
            },
            {
              key: "nik",
              title: "NIK",
              className: "font-mono text-xs text-zinc-600",
              render: (_value, employee) => orDash(employee.nikMasked),
            },
            {
              key: "email",
              title: "Email",
              className: "text-zinc-600",
              render: (_value, employee) => orDash(employee.email),
            },
            {
              key: "unit",
              title: "Divisi",
              className: "text-zinc-600",
              render: (_value, employee) => orDash(employee.unit?.name),
            },
            {
              key: "jobRole",
              title: "Job Role",
              className: "text-zinc-600",
              render: (_value, employee) => orDash(employee.jobRole?.name),
            },
            {
              key: "status",
              title: "Status",
              render: (_value, employee) => (
                <Chip size="small" variant={EMPLOYEE_STATUS_VARIANT[employee.status]}>
                  {EMPLOYEE_STATUS_LABEL[employee.status]}
                </Chip>
              ),
            },
            {
              key: "actions",
              title: "Aksi",
              className: "col-action",
              render: (_value, employee) => (
                <RowActionsMenu
                  actions={[
                    {
                      label: "Lihat detail",
                      onSelect: () => router.push(EMPLOYEE_DETAIL(employee.id)),
                    },
                    ...(manage
                      ? [
                          {
                            label: "Ubah data diri",
                            onSelect: () => {
                              setEditEmployeeId(employee.id);
                              setModalMode("edit");
                            },
                          },
                        ]
                      : []),
                  ]}
                  label={`Aksi ${employee.fullName}`}
                />
              ),
            },
          ]}
          dataSource={pageRows}
          loading={loadingMoreRow}
          loadingText={
            <>
              Memuat baris {hintFrom}–{hintTo} dari {totalCount}…
            </>
          }
          pagination={pagination}
          rowKey={(employee) => employee.id}
        />
      )}
      <EmployeeFormModal
        employeeId={editEmployeeId ?? undefined}
        mode={modalMode ?? "create"}
        onClose={() => {
          setModalMode(null);
          setEditEmployeeId(null);
        }}
        open={modalMode !== null}
      />
    </section>
  );
}
