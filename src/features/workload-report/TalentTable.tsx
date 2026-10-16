"use client";

import * as React from "react";
import { Card } from "@/components/Card";
import { Pagination } from "@/components/Pagination";
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

      <div className="table-panel">
        <div className="table-scroll">
          <table className="w-full min-w-[860px]">
            <caption className="sr-only">Tabel talent dengan workload</caption>
            <thead>
              <tr>
                <th scope="col" className="text-left">Talent</th>
                <th scope="col" className="text-left">Tribe</th>
                <th scope="col" className="text-left">Squad</th>
                <th scope="col" className="text-right">Beban (FTE)</th>
                <th scope="col" className="text-left">Status beban</th>
                <th scope="col" className="text-right">Availability</th>
                <th scope="col" className="text-right">Time spent</th>
                <th scope="col" className="text-right">Backlog</th>
                <th scope="col" className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="empty-row">
                    Tidak ada talent yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                pageRows.map((row) => (
                  <tr key={row.id}>
                    <td className="font-medium text-tp-text">{row.nama}</td>
                    <td>{row.tribe ?? "—"}</td>
                    <td>{row.squad ?? "—"}</td>
                    <td className="text-right">{row.fte}%</td>
                    <td>
                      <LoadStatusBadge status={row.statusLoad} />
                    </td>
                    <td className="text-right">{row.availability}%</td>
                    <td className="text-right">{row.totalTimespent} jam</td>
                    <td className="text-right">{row.totalBacklog}</td>
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => onView(row.talentId ?? row.id)}
                        aria-label={`Lihat detail ${row.nama}`}
                        className="rounded-full border-[1.5px] border-tp-text px-3 py-1 text-[13px] font-semibold text-tp-text transition-colors hover:bg-tp-bg"
                      >
                        Lihat
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 ? (
          <footer className="table-footer">
            <Pagination
              page={page}
              pageSize={pageSize}
              totalItems={filtered.length}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </footer>
        ) : null}
      </div>
    </Card>
  );
}
