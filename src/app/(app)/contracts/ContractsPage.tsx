"use client";

import * as React from "react";
import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { useTablePagination } from "@/components/Pagination";
import { TableFilterBar } from "@/components/TableFilterBar";
import { useModuleAccess } from "@/lib/auth/access";
import { useEmploymentContracts } from "@/features/contracts/useContracts";
import { ContractsTable } from "./ContractsTable";
import { CreateContractModal } from "@/features/contracts/CreateContractModal";
import { RenewContractModal } from "@/features/contracts/RenewContractModal";
import {
  CONTRACT_STATUS_LABEL,
  CONTRACT_TYPE_LABEL,
  CONTRACT_TYPE_ORDER,
} from "@/features/contracts/labels";
import type {
  ContractType,
  EmploymentContractFilter,
  EmploymentContractStatus,
} from "@/generated/graphql/types";

export default function ContractsPage() {
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

      <ContractsTable
        contracts={contracts}
        error={error}
        manage={manage}
        onRenew={setRenewContractId}
        pageRows={pageRows}
        pagination={pagination}
        query={query}
      />

      <CreateContractModal onClose={() => setCreateOpen(false)} open={createOpen} />
      <RenewContractModal
        contractId={renewContractId}
        onClose={() => setRenewContractId(null)}
        open={renewContractId !== null}
      />
    </section>
  );
}
