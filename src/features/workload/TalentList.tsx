"use client";

import * as React from "react";
import { IconSearch } from "@tabler/icons-react";
import { Select } from "@/components/Select";
import { TalentRow } from "./TalentRow";
import type { TalentSummary } from "./types";

type SortKey = "load-desc" | "load-asc" | "name-asc";

const SORT_LABEL: Record<SortKey, string> = {
  "load-desc": "Urutkan: Beban tertinggi",
  "load-asc": "Urutkan: Beban terendah",
  "name-asc": "Urutkan: Nama A–Z",
};

function compare(a: TalentSummary, b: TalentSummary, key: SortKey): number {
  if (key === "name-asc") return a.fullName.localeCompare(b.fullName, "id");
  const av = a.loadPercentage ?? -1;
  const bv = b.loadPercentage ?? -1;
  return key === "load-desc" ? bv - av : av - bv;
}

export function TalentList({
  talents,
  totalCount,
  secondary = "unit-role",
}: {
  talents: TalentSummary[];
  totalCount: number;
  secondary?: "unit-role" | "role";
}) {
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<SortKey>("load-desc");

  const visible = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? talents.filter((t) => t.fullName.toLowerCase().includes(needle))
      : talents;
    return [...filtered].sort((a, b) => compare(a, b, sort));
  }, [talents, query, sort]);

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap gap-2.5">
        <div className="relative min-w-[220px] max-w-[340px] flex-1">
          <IconSearch
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-tp-muted"
          />
          <input
            aria-label="Cari nama talent"
            className="h-11 w-full rounded-full border border-tp-line bg-tp-surface pl-11 pr-4 text-sm text-tp-text placeholder:text-tp-muted"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama talent…"
            type="search"
            value={query}
          />
        </div>
        <Select
          aria-label="Urutkan"
          className="w-60"
          onChange={(e) => setSort(e.target.value as SortKey)}
          options={(Object.keys(SORT_LABEL) as SortKey[]).map((key) => ({
            value: key,
            label: SORT_LABEL[key],
          }))}
          value={sort}
        />
      </div>

      {visible.length ? (
        <div className="flex flex-col gap-2.5">
          {visible.map((talent) => (
            <TalentRow key={talent.id} secondary={secondary} talent={talent} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-tp-muted">Tidak ada talent yang cocok dengan pencarian.</p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-tp-muted">
        <span>
          Menampilkan {visible.length} dari {totalCount} talent
        </span>
        <button
          className="min-h-10 rounded-full border-[1.5px] border-tp-text px-4 text-sm font-semibold text-tp-text transition-colors hover:bg-tp-bg"
          type="button"
        >
          Muat lagi
        </button>
      </div>
    </div>
  );
}
