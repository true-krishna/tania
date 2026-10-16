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
import { canManage } from "@/lib/auth/matrix";
import { useSessionRole } from "@/lib/auth/guard";
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

type ContractRowData = {
  id: string;
  contractNo: string | null;
  contractType: ContractType;
  nomorInduk: string;
  startDate: string;
  endDate: string | null;
  status: EmploymentContractStatus;
  employee: { id: string; fullName: string };
  unit: { name: string };
  jobRole: { name: string };
};

const COLUMNS: Column[] = [
  { key: "contractNo", label: "No Kontrak" },
  { key: "employee", label: "Karyawan" },
  { key: "type", label: "Jenis" },
  { key: "unit", label: "Unit" },
  { key: "role", label: "Posisi" },
  { key: "nomorInduk", label: "Nomor Induk" },
  { key: "period", label: "Periode" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Aksi", className: "col-action" },
];

function ContractRow({ contract }: { contract: ContractRowData }) {
  const router = useRouter();
  return (
    <tr className="border-b border-board-border transition-colors hover:bg-zinc-50">
      <td className="px-4 py-2.5">
        <Link
          href={`/contracts/${contract.id}`}
          className="font-medium text-zinc-900 hover:underline"
        >
          {orDash(contract.contractNo)}
        </Link>
      </td>
      <td className="px-4 py-2.5">
        <Link
          href={`/employees/${contract.employee.id}`}
          className="text-zinc-900 hover:underline"
        >
          {contract.employee.fullName}
        </Link>
      </td>
      <td className="px-4 py-2.5 text-zinc-600">{CONTRACT_TYPE_LABEL[contract.contractType]}</td>
      <td className="px-4 py-2.5 text-zinc-600">{orDash(contract.unit.name)}</td>
      <td className="px-4 py-2.5 text-zinc-600">{orDash(contract.jobRole.name)}</td>
      <td className="px-4 py-2.5 text-zinc-600">{orDash(contract.nomorInduk)}</td>
      <td className="px-4 py-2.5 text-zinc-600">
        {contract.startDate} — {contract.endDate ?? "tidak berbatas"}
      </td>
      <td className="px-4 py-2.5">
        <Chip variant={CONTRACT_STATUS_VARIANT[contract.status]} size="small">
          {CONTRACT_STATUS_LABEL[contract.status]}
        </Chip>
      </td>
      <td className="col-action">
        <RowActionsMenu
          label={`Aksi ${contract.contractNo}`}
          actions={[
            {
              label: "Lihat detail",
              onSelect: () => router.push(`/contracts/${contract.id}`),
            },
          ]}
        />
      </td>
    </tr>
  );
}

export default function ContractsPage() {
  // Chapter reads the contracts of its own chapter (2026-10-16 clarify 5); only
  // Operation and Admin manage them, so the create action is theirs alone.
  const manage = canManage(useSessionRole(), "contracts");
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
        subtitle={
          manage
            ? "Kelola kontrak kerja karyawan."
            : "Daftar kontrak kerja karyawan dalam cakupan chapter Anda (hanya baca)."
        }
        actions={
          manage ? (
            <Link href="/contracts/new" className="no-underline">
              <Button variant="primary">+ Tambah Kontrak</Button>
            </Link>
          ) : undefined
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
        <>
          <BoardTable caption="Daftar kontrak kerja" columns={COLUMNS} footer={<Pagination {...pagination} />}>
            {pageRows.map((contract) => (
              <ContractRow key={contract.id} contract={contract} />
            ))}
          </BoardTable>
        </>
      )}
    </section>
  );
}
