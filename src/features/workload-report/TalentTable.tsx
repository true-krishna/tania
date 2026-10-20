"use client";

import * as React from "react";
import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import { Input } from "@/components/Input";
import { LoadStatusBadge } from "./LoadStatusBadge";
import type { DistributionRow } from "./types";

/**
 * Tabel talent dengan workload (umpan balik pemilik produk TAN-227): pintu
 * masuk laporan per-talent. Data baris memakai baris talent tabel distribusi
 * WAD; memilih talent membuka laporannya — id talent tidak pernah ke URL.
 */
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
      [row.nama, row.tribe, row.squad].some((value) =>
        (value ?? "").toLowerCase().includes(query),
      ),
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
        <label className="flex items-center gap-2 text-[13px] font-semibold text-tp-muted">
          Cari
          <Input
            type="search"
            aria-label="Cari talent"
            placeholder="Nama, tribe, atau squad…"
            value={search}
            onChange={(e) => changeSearch(e.target.value)}
            className="h-10 max-w-72 flex-1"
          />
        </label>
      </div>

      <Table
        caption="Tabel talent dengan workload"
        rowKey={(row) => row.id}
        dataSource={pageRows}
        minWidth={860}
        emptyText="Tidak ada talent yang cocok dengan pencarian."
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
        columns={[
          {
            key: "nama",
            title: "Talent",
            className: "font-medium text-tp-text",
            render: (_value, row) => row.nama,
          },
          { key: "tribe", title: "Tribe", render: (_value, row) => row.tribe ?? "—" },
          { key: "squad", title: "Squad", render: (_value, row) => row.squad ?? "—" },
          { key: "fte", title: "Beban (FTE)", align: "right", render: (_value, row) => `${row.fte}%` },
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
                type="button"
                onClick={() => onView(row.talentId ?? row.id)}
                aria-label={`Lihat detail ${row.nama}`}
                className="rounded-full border-[1.5px] border-tp-text px-3 py-1 text-[13px] font-semibold text-tp-text transition-colors hover:bg-tp-bg"
              >
                Lihat
              </button>
            ),
          },
        ]}
      />
    </Card>
  );
}
