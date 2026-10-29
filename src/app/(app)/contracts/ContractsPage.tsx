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
import { useModuleAccess } from "@/lib/auth/access";
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
  const manage = useModuleAccess("contracts").canManage;
  const [createOpen, setCreateOpen] = React.useState(false);
  const [renewContractId, setRenewContractId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<{ contractType: string; status: string }>({
    contractType: "",
    status: "",
  });
  const filter: EmploymentContractFilter = {
    search: search || undefined,
    contractType: (filters.contractType || undefined) as ContractType | undefined,
    status: (filters.status || undefined) as EmploymentContractStatus | undefined,
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

  const { pageRows, pagination, resetPage } = useTablePagination(contracts, {
    totalItems: totalCount,
    hasMore: hasNextPage,
    loadingMore,
    loadMore,
  });

  function changeFilter(key: string, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    resetPage();
  }

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
        subtitle={
          manage
            ? "Kelola kontrak kerja karyawan."
            : "Daftar kontrak kerja karyawan dalam cakupan chapter Anda (hanya baca)."
        }
        title="Kontrak Kerja"
      />

      <TableFilterBar
        fields={[
          {
            key: "contractType",
            label: "Jenis",
            options: [
              { value: "", label: "Semua" },
              ...CONTRACT_TYPE_ORDER.map((type) => ({
                value: type,
                label: CONTRACT_TYPE_LABEL[type],
              })),
            ],
            type: "select",
          },
          {
            key: "status",
            label: "Status",
            options: [
              { value: "", label: "Semua" },
              ...(
                Object.keys(CONTRACT_STATUS_LABEL) as Array<keyof typeof CONTRACT_STATUS_LABEL>
              ).map((value) => ({ value, label: CONTRACT_STATUS_LABEL[value] })),
            ],
            type: "select",
          },
        ]}
        onChange={changeFilter}
        search={{
          label: "Cari kontrak",
          onChange: (value) => {
            setSearch(value);
            resetPage();
          },
          placeholder: "Cari nama karyawan, no kontrak, atau nomor induk…",
          value: search,
        }}
        values={filters}
      />

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
