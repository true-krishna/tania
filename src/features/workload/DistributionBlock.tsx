"use client";

import * as React from "react";
import { TalentRow } from "./TalentRow";
import type { DistributionDimension, DistributionRowData } from "./types";

const DIMENSIONS: { key: DistributionDimension; label: string }[] = [
  { key: "UNIT", label: "Unit" },
  { key: "CHAPTER", label: "Chapter" },
  { key: "PROJECT", label: "Proyek" },
];

const LEGEND = [
  { key: "optimal", label: "Optimal", color: "var(--tp-ink-mint)" },
  { key: "underload", label: "Beban kurang", color: "var(--tp-ink-info)" },
  { key: "overload", label: "Kelebihan beban", color: "var(--tp-ink-peach)" },
  { key: "undefined", label: "Data tidak lengkap", color: "var(--tp-line)" },
] as const;

const SEGMENT_CLASS: Record<(typeof LEGEND)[number]["key"], string> = {
  optimal: "bg-tp-tint-mint",
  underload: "bg-tp-tint-info",
  overload: "bg-tp-tint-peach",
  undefined: "bg-tp-line",
};

function StackedBar({ row }: { row: DistributionRowData }) {
  const total = row.counts.optimal + row.counts.underload + row.counts.overload + row.counts.undefined;
  if (total === 0) return <div className="h-3 rounded-full bg-tp-bg" />;

  const aria = `${row.counts.optimal} optimal, ${row.counts.underload} beban kurang, ${row.counts.overload} kelebihan beban, ${row.counts.undefined} data tidak lengkap`;

  return (
    <div role="img" aria-label={aria} className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-tp-bg">
      {LEGEND.map((segment) => {
        const count = row.counts[segment.key];
        if (count === 0) return null;
        return (
          <span
            key={segment.key}
            className={`block h-full ${SEGMENT_CLASS[segment.key]}`}
            style={{ width: `${(count / total) * 100}%` }}
          />
        );
      })}
    </div>
  );
}

function DistributionRow({ row }: { row: DistributionRowData }) {
  const [expanded, setExpanded] = React.useState(false);
  const panelId = `dist-drill-${row.id}`;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-1 items-center gap-x-4 gap-y-2.5 rounded-[14px] border border-tp-line bg-tp-surface px-[18px] py-3.5 shadow-[0_1px_2px_rgba(16,26,71,0.06)] min-[860px]:grid-cols-[minmax(140px,1fr)_minmax(220px,2fr)_90px_auto]">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-tp-text">{row.label}</p>
          <p className="text-[12.5px] text-tp-muted">Rata-rata {row.averageLoadPercentage}%</p>
        </div>
        <div className="min-[860px]:order-none">
          <StackedBar row={row} />
        </div>
        <p className="text-[13px] text-tp-muted">{row.talentCount} talent</p>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          aria-label={`${expanded ? "Sembunyikan" : "Lihat"} talent ${row.label}`}
          onClick={() => setExpanded((v) => !v)}
          className="min-h-10 justify-self-start rounded-full border-[1.5px] border-tp-text px-4 text-sm font-semibold text-tp-text transition-colors hover:bg-tp-bg"
        >
          Lihat talent
        </button>
      </div>

      {expanded ? (
        <div
          id={panelId}
          role="region"
          aria-label={`Talent dalam ${row.label}`}
          className="flex flex-col gap-3 rounded-[14px] border border-tp-line bg-tp-bg p-3.5"
        >
          <p className="flex flex-wrap justify-between gap-2.5 text-[13px] text-tp-muted">
            <span>Talent dalam {row.label} — komponen agregat</span>
            <span>
              Menampilkan {row.talents.length} dari {row.talentCount}
            </span>
          </p>
          {row.talents.length ? (
            <div className="flex flex-col gap-2.5">
              {row.talents.map((talent) => (
                <TalentRow key={talent.id} talent={talent} secondary="role" />
              ))}
            </div>
          ) : (
            <p className="text-sm text-tp-muted">Rincian talent belum tersedia.</p>
          )}
          <p className="flex flex-wrap items-center justify-between gap-2.5 text-[13px] text-tp-muted">
            <span>Rincian talent adalah komponen dari agregat {row.label} di atas</span>
            <button
              type="button"
              className="min-h-10 rounded-full border-[1.5px] border-tp-text px-4 text-sm font-semibold text-tp-text transition-colors hover:bg-tp-surface"
            >
              Muat lagi
            </button>
          </p>
        </div>
      ) : null}
    </div>
  );
}

/** Organisation distribution with dimension tabs and drill-down (FR-023; design §4). */
export function DistributionBlock({
  rows,
}: {
  rows: Record<DistributionDimension, DistributionRowData[]>;
}) {
  const [dimension, setDimension] = React.useState<DistributionDimension>("CHAPTER");
  const active = rows[dimension] ?? [];

  return (
    <div className="flex flex-col gap-3.5">
      <div
        role="tablist"
        aria-label="Dimensi distribusi"
        className="flex gap-1 overflow-x-auto rounded-[14px] border border-tp-line bg-tp-bg p-1"
      >
        {DIMENSIONS.map((dim) => {
          const selected = dim.key === dimension;
          return (
            <button
              key={dim.key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setDimension(dim.key)}
              className={
                selected
                  ? "flex-none rounded-[10px] bg-tp-surface px-3.5 py-2 text-sm font-semibold text-tp-text shadow-[0_0_0_1px_var(--tp-line)]"
                  : "flex-none rounded-[10px] px-3.5 py-2 text-sm font-medium text-tp-muted"
              }
            >
              {dim.label}
            </button>
          );
        })}
      </div>

      {active.length ? (
        <div className="flex flex-col gap-2.5">
          {active.map((row) => (
            <DistributionRow key={row.id} row={row} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-tp-muted">Belum ada distribusi untuk dimensi ini.</p>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-2 text-[13px] text-tp-muted">
        {LEGEND.map((item) => (
          <span key={item.key} className="inline-flex items-center gap-1.5">
            <i
              aria-hidden
              className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
              style={{ background: item.color }}
            />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
