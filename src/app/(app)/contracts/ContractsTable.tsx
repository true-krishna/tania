"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { Chip } from "@/components/Chip";
import { Table } from "@/components/Table";
import { RowActionsMenu } from "@/components/RowActionsMenu";
import {
  CONTRACT_STATUS_LABEL,
  CONTRACT_STATUS_VARIANT,
  CONTRACT_TYPE_LABEL,
} from "@/features/contracts/labels";
import type * as React from "react";
import type { EmploymentContractsQuery } from "@/generated/graphql";
import type { QueryStatus } from "@/lib/apollo/toQueryState";
import { orDash } from "@/lib/cell";
import { CONTRACT_DETAIL, EMPLOYEE_DETAIL } from "@/lib/constants/routes";

type ContractNode = EmploymentContractsQuery["employmentContracts"]["edges"][number]["node"];

type ContractPagination = React.ComponentProps<typeof Table>["pagination"];

export function ContractsTable({
  query,
  error,
  contracts,
  pageRows,
  pagination,
  manage,
  onRenew,
}: {
  query: QueryStatus;
  error: string | null;
  contracts: readonly ContractNode[] | undefined;
  pageRows: readonly ContractNode[];
  pagination: ContractPagination;
  manage: boolean;
  onRenew: (id: string) => void;
}) {
  const router = useRouter();

  if (query === "loading") return <LoadingState />;
  if (query === "error") return <ErrorState message={error ?? "Gagal memuat data kontrak."} />;
  if (!contracts || contracts.length === 0) {
    return <EmptyState message="Tidak ada kontrak yang cocok dengan pencarian/filter." />;
  }

  return (
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
                        onSelect: () => onRenew(contract.id),
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
  );
}
