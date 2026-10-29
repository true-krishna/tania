"use client";

import * as React from "react";
import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import { TableFilterBar } from "@/components/TableFilterBar";
import { LoadStatusBadge } from "./LoadStatusBadge";
import type { DistributionRow } from "./types";

export function TalentTable({
  rows,
  onView,
}: {
  rows: DistributionRow[];
  onView: (talentId: string) => void;
}) {
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const query = search.trim().toLowerCase();
  const filtered = rows.filter(
    (row) =>
      !query ||
      [row.nama, row.tribe, row.squad].some((value) => (value ?? "").toLowerCase().includes(query)),
  );
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  function changeSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="tp-h3">Talent</h2>
          <p className="tp-label mt-1">
            Tabel talent dengan workload periode terpilih — pilih talent untuk melihat laporannya.
          </p>
        </div>
      </div>

      <TableFilterBar
        search={{
          label: "Cari talent",
          onChange: changeSearch,
          placeholder: "Nama, tribe, atau squad…",
          value: search,
        }}
      />

      <Table
        caption="Tabel talent dengan workload"
        columns={[
          {
            key: "nama",
            title: "Talent",
            className: "font-medium text-tp-text",
            render: (_value, row) => row.nama,
          },
          { key: "tribe", title: "Tribe", render: (_value, row) => row.tribe ?? "—" },
          { key: "squad", title: "Squad", render: (_value, row) => row.squad ?? "—" },
          {
            key: "fte",
            title: "Beban (FTE)",
            align: "right",
            render: (_value, row) => `${row.fte}%`,
          },
          {
            key: "statusLoad",
            title: "Status beban",
            render: (_value, row) => <LoadStatusBadge status={row.statusLoad} />,
          },
          {
            key: "availability",
            title: "Availability",
            align: "right",
            render: (_value, row) => `${row.availability}%`,
          },
          {
            key: "totalTimespent",
            title: "Time spent",
            align: "right",
            render: (_value, row) => `${row.totalTimespent} jam`,
          },
          {
            key: "totalBacklog",
            title: "Backlog",
            align: "right",
            render: (_value, row) => row.totalBacklog,
          },
          {
            key: "aksi",
            title: "Aksi",
            align: "right",
            render: (_value, row) => (
              <button
                aria-label={`Lihat detail ${row.nama}`}
                className="rounded-full border-[1.5px] border-tp-text px-3 py-1 text-[13px] font-semibold text-tp-text transition-colors hover:bg-tp-bg"
                onClick={() => onView(row.talentId ?? row.id)}
                type="button"
              >
                Lihat
              </button>
            ),
          },
        ]}
        dataSource={pageRows}
        emptyText="Tidak ada talent yang cocok dengan pencarian."
        minWidth={860}
        pagination={
          filtered.length > 0
            ? {
                page,
                pageSize,
                totalItems: filtered.length,
                onPageChange: setPage,
                onPageSizeChange: (size) => {
                  setPageSize(size);
                  setPage(1);
                },
              }
            : undefined
        }
        rowKey={(row) => row.id}
      />
    </Card>
  );
}
