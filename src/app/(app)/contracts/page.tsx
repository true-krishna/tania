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
import { canManage } from "@/lib/auth/matrix";
import { useSessionRole } from "@/lib/auth/guard";
import { useEmploymentContracts } from "@/features/contracts/useContracts";
import { CreateContractModal } from "@/features/contracts/CreateContractModal";
import { RenewContractModal } from "@/features/contracts/RenewContractModal";
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
import { CONTRACT_DETAIL, EMPLOYEE_DETAIL } from "@/lib/constants/routes";

export default function ContractsPage() {
  const router = useRouter();
  const manage = canManage(useSessionRole(), "contracts");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [renewContractId, setRenewContractId] = React.useState<string | null>(null);
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
        actions={
          manage ? (
            <Button onClick={() => setCreateOpen(true)} type="button">
              + Tambah Kontrak
            </Button>
          ) : undefined
        }
        filters={
          <FilterButton
            activeCount={activeFilters}
            expanded={filtersOpen}
            onClick={() => setFiltersOpen((open) => !open)}
            panelId="contract-filter-panel"
          />
        }
        search={
          <label className="flex w-full max-w-xs items-center gap-2 text-sm text-zinc-700">
            <span className="sr-only">Cari kontrak</span>
            <Input
              onChange={(e) => {
                setSearch(e.target.value);
                resetPage();
              }}
              placeholder="Cari nama karyawan, no kontrak, atau nomor induk…"
              type="search"
              value={search}
            />
          </label>
        }
        subtitle={
          manage
            ? "Kelola kontrak kerja karyawan."
            : "Daftar kontrak kerja karyawan dalam cakupan chapter Anda (hanya baca)."
        }
        title="Kontrak Kerja"
      />

      {filtersOpen ? (
        <div className="tp-card flex flex-wrap items-end gap-4" id="contract-filter-panel">
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <span>Jenis</span>
            <Select
              className="w-auto"
              onChange={(e) => {
                setContractType(e.target.value as ContractType | "ALL");
                resetPage();
              }}
              options={[
                { value: "ALL", label: "Semua" },
                ...CONTRACT_TYPE_ORDER.map((type) => ({
                  value: type,
                  label: CONTRACT_TYPE_LABEL[type],
                })),
              ]}
              value={contractType}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <span>Status</span>
            <Select
              className="w-auto"
              onChange={(e) => {
                setStatus(e.target.value as EmploymentContractStatus | "ALL");
                resetPage();
              }}
              options={[
                { value: "ALL", label: "Semua" },
                ...(Object.keys(CONTRACT_STATUS_LABEL) as Array<
                  keyof typeof CONTRACT_STATUS_LABEL
                >).map((value) => ({ value, label: CONTRACT_STATUS_LABEL[value] })),
              ]}
              value={status}
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
          columns={[
            {
              key: "contractNo",
              title: "No Kontrak",
              render: (_value, contract) => (
                <Link
                  className="font-medium text-zinc-900 hover:underline"
                  href={CONTRACT_DETAIL(contract.id)}
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
                  className="text-zinc-900 hover:underline"
                  href={EMPLOYEE_DETAIL(contract.employee.id)}
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
                <Chip size="small" variant={CONTRACT_STATUS_VARIANT[contract.status]}>
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
                  actions={[
                    {
                      label: "Lihat detail",
                      onSelect: () => router.push(CONTRACT_DETAIL(contract.id)),
                    },
                    ...(manage
                      ? [
                          {
                            label: "Perpanjang",
                            onSelect: () => setRenewContractId(contract.id),
                          },
                        ]
                      : []),
                  ]}
                  label={`Aksi ${contract.contractNo}`}
                />
              ),
            },
          ]}
          dataSource={pageRows}
          pagination={pagination}
          rowKey={(contract) => contract.id}
        />
      )}

      <CreateContractModal onClose={() => setCreateOpen(false)} open={createOpen} />
      <RenewContractModal
        contractId={renewContractId}
        onClose={() => setRenewContractId(null)}
        open={renewContractId !== null}
      />
    </section>
  );
}
