"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { Table } from "@/components/Table";
import { Button } from "@/components/Button";
import { Chip } from "@/components/Chip";
import { FilterButton } from "@/components/FilterButton";
import { Input } from "@/components/Input";
import { PageHeader } from "@/components/PageHeader";
import { useTablePagination } from "@/components/Pagination";
import { RowActionsMenu } from "@/components/RowActionsMenu";
import { Select } from "@/components/Select";
import { useEmploymentContracts } from "@/features/contracts/useContracts";
import {
  CONTRACT_STATUS_LABEL,
  CONTRACT_STATUS_VARIANT,
  CONTRACT_TYPE_LABEL,
  CONTRACT_TYPE_ORDER,
} from "@/features/contracts/labels";
import type {
  ContractType,
  EmploymentContractFilter,
  EmploymentContractStatus,
} from "@/generated/graphql/types";
import { orDash } from "@/lib/cell";
import { CONTRACT_NEW, CONTRACT_DETAIL, EMPLOYEE_DETAIL } from "@/lib/constants/routes";

export default function ContractsPage() {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [contractType, setContractType] = React.useState<ContractType | "ALL">("ALL");
  const [status, setStatus] = React.useState<EmploymentContractStatus | "ALL">("ALL");
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const filter: EmploymentContractFilter = {
    search: search || undefined,
    contractType: contractType === "ALL" ? undefined : contractType,
    status: status === "ALL" ? undefined : status,
  };
  const {
    status: query,
    contracts,
    totalCount,
    hasNextPage,
    loadingMore,
    error,
    loadMore,
  } = useEmploymentContracts(filter);
  const activeFilters = (contractType !== "ALL" ? 1 : 0) + (status !== "ALL" ? 1 : 0);

  const { pageRows, pagination, resetPage } = useTablePagination(contracts, {
    totalItems: totalCount,
    hasMore: hasNextPage,
    loadingMore,
    loadMore,
  });

  return (
    <section className="flex flex-col gap-4">
      <PageHeader
        title="Kontrak Kerja"
        subtitle="Kelola kontrak kerja karyawan (Operation)."
        actions={
          <Link href={CONTRACT_NEW} className="no-underline">
            <Button variant="primary">+ Tambah Kontrak</Button>
          </Link>
        }
        search={
          <label className="flex w-full max-w-xs items-center gap-2 text-sm text-zinc-700">
            <span className="sr-only">Cari kontrak</span>
            <Input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetPage();
              }}
              placeholder="Cari nama karyawan, no kontrak, atau nomor induk…"
            />
          </label>
        }
        filters={
          <FilterButton
            activeCount={activeFilters}
            expanded={filtersOpen}
            onClick={() => setFiltersOpen((open) => !open)}
            panelId="contract-filter-panel"
          />
        }
      />

      {filtersOpen ? (
        <div id="contract-filter-panel" className="tp-card flex flex-wrap items-end gap-4">
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <span>Jenis</span>
            <Select
              value={contractType}
              onChange={(e) => {
                setContractType(e.target.value as ContractType | "ALL");
                resetPage();
              }}
              className="w-auto"
              options={[
                { value: "ALL", label: "Semua" },
                ...CONTRACT_TYPE_ORDER.map((type) => ({
                  value: type,
                  label: CONTRACT_TYPE_LABEL[type],
                })),
              ]}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <span>Status</span>
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as EmploymentContractStatus | "ALL");
                resetPage();
              }}
              className="w-auto"
              options={[
                { value: "ALL", label: "Semua" },
                ...(Object.keys(CONTRACT_STATUS_LABEL) as Array<
                  keyof typeof CONTRACT_STATUS_LABEL
                >).map((value) => ({ value, label: CONTRACT_STATUS_LABEL[value] })),
              ]}
            />
          </label>
        </div>
      ) : null}

      {query === "loading" ? (
        <LoadingState />
      ) : query === "error" ? (
        <ErrorState message={error ?? "Gagal memuat data kontrak."} />
      ) : !contracts || contracts.length === 0 ? (
        <EmptyState message="Tidak ada kontrak yang cocok dengan pencarian/filter." />
      ) : (
        <Table
          caption="Daftar kontrak kerja"
          rowKey={(contract) => contract.id}
          dataSource={pageRows}
          pagination={pagination}
          columns={[
            {
              key: "contractNo",
              title: "No Kontrak",
              render: (_value, contract) => (
                <Link
                  href={CONTRACT_DETAIL(contract.id)}
                  className="font-medium text-zinc-900 hover:underline"
                >
                  {orDash(contract.contractNo)}
                </Link>
              ),
            },
            {
              key: "employee",
              title: "Karyawan",
              render: (_value, contract) => (
                <Link
                  href={EMPLOYEE_DETAIL(contract.employee.id)}
                  className="text-zinc-900 hover:underline"
                >
                  {contract.employee.fullName}
                </Link>
              ),
            },
            {
              key: "type",
              title: "Jenis",
              className: "text-zinc-600",
              render: (_value, contract) => CONTRACT_TYPE_LABEL[contract.contractType],
            },
            {
              key: "unit",
              title: "Unit",
              className: "text-zinc-600",
              render: (_value, contract) => orDash(contract.unit.name),
            },
            {
              key: "role",
              title: "Posisi",
              className: "text-zinc-600",
              render: (_value, contract) => orDash(contract.jobRole.name),
            },
            {
              key: "nomorInduk",
              title: "Nomor Induk",
              className: "text-zinc-600",
              render: (_value, contract) => orDash(contract.nomorInduk),
            },
            {
              key: "period",
              title: "Periode",
              className: "text-zinc-600",
              render: (_value, contract) => (
                <>
                  {contract.startDate} — {contract.endDate ?? "tidak berbatas"}
                </>
              ),
            },
            {
              key: "status",
              title: "Status",
              render: (_value, contract) => (
                <Chip variant={CONTRACT_STATUS_VARIANT[contract.status]} size="small">
                  {CONTRACT_STATUS_LABEL[contract.status]}
                </Chip>
              ),
            },
            {
              key: "actions",
              title: "Aksi",
              className: "col-action",
              render: (_value, contract) => (
                <RowActionsMenu
                  label={`Aksi ${contract.contractNo}`}
                  actions={[
                    {
                      label: "Lihat detail",
                      onSelect: () => router.push(CONTRACT_DETAIL(contract.id)),
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      )}
    </section>
  );
}
