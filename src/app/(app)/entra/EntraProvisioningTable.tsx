"use client";

import Link from "next/link";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { Table } from "@/components/Table";
import { RowActionsMenu, type RowAction } from "@/components/RowActionsMenu";
import type { EntraEmployeeSortField } from "@/generated/graphql/types";
import { orDash } from "@/lib/cell";
import { EMPLOYEE_DETAIL } from "@/lib/constants/routes";
import { EntraProvisionStatusCell } from "./EntraProvisionStatusCell";
import { EntraSortHeader, sortAria, type SortState } from "./EntraSortHeader";
import type { EntraListEmployee } from "./types";

type EntraPagination = React.ComponentProps<typeof Table>["pagination"];

export function EntraProvisioningTable({
  status,
  error,
  employees,
  pageRows,
  pagination,
  searching,
  sort,
  onToggleSort,
  rowActions,
}: {
  status: "loading" | "ready" | "error";
  error: string | null;
  employees: readonly EntraListEmployee[] | undefined;
  pageRows: readonly EntraListEmployee[];
  pagination: EntraPagination;
  searching: boolean;
  sort: SortState;
  onToggleSort: (key: EntraEmployeeSortField) => void;
  rowActions: (employee: EntraListEmployee) => RowAction[];
}) {
  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={error ?? "Terjadi kesalahan."} />;
  if (status === "ready" && employees?.length === 0) {
    return (
      <EmptyState
        message={
          searching
            ? "Tidak ada talent yang cocok dengan pencarian."
            : "Semua talent sudah memiliki akun Entra."
        }
      />
    );
  }
  if (status !== "ready" || !employees || employees.length === 0) return null;

  return (
    <Table
      caption="Talent untuk provisi akun Entra"
      columns={[
        {
          key: "name",
          title: (
            <EntraSortHeader label="Nama" onToggle={onToggleSort} sort={sort} sortKey="FULL_NAME" />
          ),
          headerProps: { "aria-sort": sortAria(sort, "FULL_NAME") },
          render: (_value, employee) => (
            <Link
              className="font-medium text-zinc-900 hover:underline"
              href={EMPLOYEE_DETAIL(employee.id)}
            >
              {employee.fullName}
            </Link>
          ),
        },
        {
          key: "email",
          title: (
            <EntraSortHeader label="Email" onToggle={onToggleSort} sort={sort} sortKey="EMAIL" />
          ),
          headerProps: { "aria-sort": sortAria(sort, "EMAIL") },
          className: "text-zinc-600",
          render: (_value, employee) => orDash(employee.email),
        },
        {
          key: "provision",
          title: (
            <EntraSortHeader
              label="Hasil provisi"
              onToggle={onToggleSort}
              sort={sort}
              sortKey="PROVISION_STATUS"
            />
          ),
          headerProps: { "aria-sort": sortAria(sort, "PROVISION_STATUS") },
          render: (_value, employee) => (
            <EntraProvisionStatusCell outcome={employee.entraProvision} />
          ),
        },
        {
          key: "action",
          title: "Aksi",
          className: "col-action",
          render: (_value, employee) => (
            <RowActionsMenu actions={rowActions(employee)} label={`Aksi ${employee.fullName}`} />
          ),
        },
      ]}
      dataSource={pageRows}
      pagination={pagination}
      rowKey={(employee) => employee.id}
    />
  );
}
