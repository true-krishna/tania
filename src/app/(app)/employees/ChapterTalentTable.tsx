"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { Table } from "@/components/Table";
import { useTablePagination } from "@/components/Pagination";
import { RowActionsMenu } from "@/components/RowActionsMenu";
import { useAssignableTalents } from "@/features/employees/useEmployees";
import type { EmployeeListSortField } from "@/generated/graphql/types";
import { EMPLOYEE_DETAIL } from "@/lib/constants/routes";
import { orDash } from "@/lib/cell";
import { ChapterSortHeader, chapterSortAria, type ChapterSortState } from "./ChapterSortHeader";

export function ChapterTalentTable() {
  const router = useRouter();
  const [sort, setSort] = React.useState<ChapterSortState>(null);
  const sortBy: EmployeeListSortField = sort?.key ?? "FULL_NAME";
  const sortDirection = sort?.dir ?? "ASC";
  const { status, data, error, totalCount, hasNextPage, loadingMore, loadMore } =
    useAssignableTalents({ sortBy, sortDirection });
  const { pageRows, pagination, resetPage } = useTablePagination(data, {
    totalItems: totalCount,
    hasMore: hasNextPage,
    loadingMore,
    loadMore,
  });

  function toggleSort(key: EmployeeListSortField) {
    resetPage();
    setSort((current) => {
      if (!current || current.key !== key) return { key, dir: "ASC" };
      if (current.dir === "ASC") return { key, dir: "DESC" };
      return null;
    });
  }

  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={error ?? "Gagal memuat data."} />;
  if (!data || data.length === 0) {
    return <EmptyState message="Belum ada talent dalam cakupan chapter Anda." />;
  }

  return (
    <Table
      caption="Talent dalam cakupan chapter"
      columns={[
        {
          key: "name",
          title: (
            <ChapterSortHeader label="Nama" onToggle={toggleSort} sort={sort} sortKey="FULL_NAME" />
          ),
          headerProps: { "aria-sort": chapterSortAria(sort, "FULL_NAME") },
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
          title: (
            <ChapterSortHeader
              label="Nomor Induk"
              onToggle={toggleSort}
              sort={sort}
              sortKey="NOMOR_INDUK"
            />
          ),
          headerProps: { "aria-sort": chapterSortAria(sort, "NOMOR_INDUK") },
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
      dataSource={pageRows}
      pagination={pagination}
      rowKey={(talent) => talent.id}
    />
  );
}
