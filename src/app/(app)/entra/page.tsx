"use client";

import Link from "next/link";
import * as React from "react";
import { ApolloError, useMutation } from "@apollo/client";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import { Table } from "@/components/Table";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { PageHeader } from "@/components/PageHeader";
import { useTablePagination } from "@/components/Pagination";
import { RowActionsMenu } from "@/components/RowActionsMenu";
import { TableFilterBar } from "@/components/TableFilterBar";
import {
  EmployeesWithoutEntraDocument,
  ProvisionEntraAccountDocument,
} from "@/generated/graphql";
import type { EntraEmployeeSortField, SortDirection } from "@/generated/graphql/types";
import {
  ENTRA_PROVISION_STATUS_LABEL,
  ENTRA_PROVISION_STATUS_TONE,
} from "@/features/entra/labels";
import {
  ENTRA_LIST_VARIABLES,
  useEmployeesWithoutEntra,
} from "@/features/entra/useEmployeesWithoutEntra";
import { mapSubmitError } from "@/lib/errors";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { orDash } from "@/lib/cell";
import { EMPLOYEE_DETAIL } from "@/lib/constants/routes";

type SortState = { key: EntraEmployeeSortField; dir: SortDirection } | null;

function sortAria(
  sort: SortState,
  key: EntraEmployeeSortField
): "ascending" | "descending" | undefined {
  if (!sort || sort.key !== key) return undefined;
  return sort.dir === "ASC" ? "ascending" : "descending";
}

function SortHeader({
  label,
  sortKey,
  sort,
  onToggle,
}: {
  label: string;
  sortKey: EntraEmployeeSortField;
  sort: SortState;
  onToggle: (key: EntraEmployeeSortField) => void;
}) {
  return (
    <button
      className="inline-flex items-center gap-1 hover:text-tp-text"
      onClick={() => onToggle(sortKey)}
      type="button"
    >
      {label}
      {sort?.key === sortKey ? (
        sort.dir === "ASC" ? (
          <IconChevronUp aria-hidden size={14} stroke={2} />
        ) : (
          <IconChevronDown aria-hidden size={14} stroke={2} />
        )
      ) : null}
    </button>
  );
}

export default function EntraProvisioningPage() {
  const [searchInput, setSearchInput] = React.useState("");
  const search = useDebouncedValue(searchInput);
  const [sort, setSort] = React.useState<SortState>(null);
  const sortBy: EntraEmployeeSortField = sort?.key ?? "FULL_NAME";
  const sortDirection: SortDirection = sort?.dir ?? "ASC";
  const { status, employees, totalCount, hasNextPage, loadingMore, loadMore, error } =
    useEmployeesWithoutEntra({ search, sortBy, sortDirection });
  const { pageRows, pagination, resetPage } = useTablePagination(employees, {
    totalItems: totalCount,
    hasMore: hasNextPage,
    loadingMore,
    loadMore,
  });
  const listVariables = React.useMemo(
    () => ({
      ...ENTRA_LIST_VARIABLES,
      search: search.trim() || null,
      sortBy,
      sortDirection,
    }),
    [search, sortBy, sortDirection]
  );
  const [provisionEntra] = useMutation(ProvisionEntraAccountDocument, {
    refetchQueries: [
      { query: EmployeesWithoutEntraDocument, variables: listVariables },
    ],
    awaitRefetchQueries: true,
  });
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<{
    tone: "ok" | "error";
    text: string;
  } | null>(null);

  function toggleSort(key: EntraEmployeeSortField) {
    resetPage();
    setSort((current) => {
      if (!current || current.key !== key) return { key, dir: "ASC" };
      if (current.dir === "ASC") return { key, dir: "DESC" };
      return null;
    });
  }

  async function provision(employeeId: string, fullName: string) {
    setBusyId(employeeId);
    setMessage(null);
    try {
      const result = await provisionEntra({ variables: { employeeId } });
      const provisioned = result.data?.provisionEntraAccount.entraProvision;
      if (!provisioned) return;
      if (provisioned.status === "FAILED") {
        setMessage({
          tone: "error",
          text: `Provisi akun ${fullName} gagal: ${provisioned.lastError ?? "kesalahan tidak diketahui"}. Coba lagi nanti.`,
        });
      } else {
        setMessage({
          tone: "ok",
          text: `Provisi akun ${fullName} berhasil (${ENTRA_PROVISION_STATUS_LABEL[provisioned.status].toLowerCase()}).`,
        });
      }
    } catch (err) {
      const submitError = mapSubmitError(
        err instanceof ApolloError ? err : null,
        "Akun Entra talent ini sudah terdaftar.",
        "Gagal memprovisi akun Entra."
      );
      setMessage({ tone: "error", text: submitError.message });
    } finally {
      setBusyId(null);
    }
  }

  const searching = search.trim().length > 0;

  return (
    <section className="flex flex-col gap-4">
      <PageHeader
        subtitle="Talent yang belum memiliki akun Microsoft Entra — provisioning manual atau ulang setelah gagal (Operation)."
        title="Provisi Akun Entra"
      />

      <TableFilterBar
        search={{
          label: "Cari nama karyawan",
          onChange: (value) => {
            setSearchInput(value);
            resetPage();
          },
          placeholder: "Cari nama karyawan…",
          value: searchInput,
        }}
      />

      {message ? (
        <div
          className={`rounded-md border p-4 text-sm ${
            message.tone === "ok"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
          role={message.tone === "error" ? "alert" : "status"}
        >
          {message.text}
        </div>
      ) : null}

      {status === "loading" ? <LoadingState /> : null}
      {status === "error" ? <ErrorState message={error ?? "Terjadi kesalahan."} /> : null}

      {status === "ready" && employees?.length === 0 ? (
        <EmptyState
          message={
            searching
              ? "Tidak ada talent yang cocok dengan pencarian."
              : "Semua talent sudah memiliki akun Entra."
          }
        />
      ) : null}

      {status === "ready" && employees && employees.length > 0 ? (
        <Table
          caption="Talent tanpa akun Entra"
          columns={[
            {
              key: "name",
              title: (
                <SortHeader
                  label="Nama"
                  onToggle={toggleSort}
                  sort={sort}
                  sortKey="FULL_NAME"
                />
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
                <SortHeader
                  label="Email"
                  onToggle={toggleSort}
                  sort={sort}
                  sortKey="EMAIL"
                />
              ),
              headerProps: { "aria-sort": sortAria(sort, "EMAIL") },
              className: "text-zinc-600",
              render: (_value, employee) => orDash(employee.email),
            },
            {
              key: "provision",
              title: (
                <SortHeader
                  label="Hasil provisi"
                  onToggle={toggleSort}
                  sort={sort}
                  sortKey="PROVISION_STATUS"
                />
              ),
              headerProps: { "aria-sort": sortAria(sort, "PROVISION_STATUS") },
              render: (_value, employee) => {
                const outcome = employee.entraProvision;
                if (!outcome) return <span className="text-xs text-zinc-500">Belum dibuat</span>;
                const failed = outcome.status === "FAILED";
                return (
                  <>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${ENTRA_PROVISION_STATUS_TONE[outcome.status]}`}
                    >
                      {ENTRA_PROVISION_STATUS_LABEL[outcome.status]}
                    </span>
                    <span className="mt-1 block text-xs text-zinc-500">
                      {orDash(failed ? outcome.lastError : outcome.upn ?? outcome.action)}
                    </span>
                  </>
                );
              },
            },
            {
              key: "action",
              title: "Aksi",
              className: "col-action",
              render: (_value, employee) => {
                const failed = employee.entraProvision?.status === "FAILED";
                return (
                  <RowActionsMenu
                    actions={[
                      {
                        label:
                          busyId === employee.id
                            ? "Memproses…"
                            : failed
                              ? "Coba lagi"
                              : "Provisioning",
                        onSelect: () => void provision(employee.id, employee.fullName),
                        disabled: busyId !== null,
                      },
                    ]}
                    label={`Aksi ${employee.fullName}`}
                  />
                );
              },
            },
          ]}
          dataSource={pageRows}
          pagination={pagination}
          rowKey={(employee) => employee.id}
        />
      ) : null}
    </section>
  );
}
