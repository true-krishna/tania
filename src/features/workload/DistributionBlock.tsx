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
    <div aria-label={aria} className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-tp-bg" role="img">
      {LEGEND.map((segment) => {
        const count = row.counts[segment.key];
        if (count === 0) return null;
        return (
          <span
            className={`block h-full ${SEGMENT_CLASS[segment.key]}`}
            key={segment.key}
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
          aria-controls={panelId}
          aria-expanded={expanded}
          aria-label={`${expanded ? "Sembunyikan" : "Lihat"} talent ${row.label}`}
          className="min-h-10 justify-self-start rounded-full border-[1.5px] border-tp-text px-4 text-sm font-semibold text-tp-text transition-colors hover:bg-tp-bg"
          onClick={() => setExpanded((v) => !v)}
          type="button"
        >
          Lihat talent
        </button>
      </div>

      {expanded ? (
        <div
          aria-label={`Talent dalam ${row.label}`}
          className="flex flex-col gap-3 rounded-[14px] border border-tp-line bg-tp-bg p-3.5"
          id={panelId}
          role="region"
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
                <TalentRow key={talent.id} secondary="role" talent={talent} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-tp-muted">Rincian talent belum tersedia.</p>
          )}
          <p className="flex flex-wrap items-center justify-between gap-2.5 text-[13px] text-tp-muted">
            <span>Rincian talent adalah komponen dari agregat {row.label} di atas</span>
            <button
              className="min-h-10 rounded-full border-[1.5px] border-tp-text px-4 text-sm font-semibold text-tp-text transition-colors hover:bg-tp-surface"
              type="button"
            >
              Muat lagi
            </button>
          </p>
        </div>
      ) : null}
    </div>
  );
}

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
        aria-label="Dimensi distribusi"
        className="flex gap-1 overflow-x-auto rounded-[14px] border border-tp-line bg-tp-bg p-1"
        role="tablist"
      >
        {DIMENSIONS.map((dim) => {
          const selected = dim.key === dimension;
          return (
            <button
              aria-selected={selected}
              className={
                selected
                  ? "flex-none rounded-[10px] bg-tp-surface px-3.5 py-2 text-sm font-semibold text-tp-text shadow-[0_0_0_1px_var(--tp-line)]"
                  : "flex-none rounded-[10px] px-3.5 py-2 text-sm font-medium text-tp-muted"
              }
              key={dim.key}
              onClick={() => setDimension(dim.key)}
              role="tab"
              type="button"
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
          <span className="inline-flex items-center gap-1.5" key={item.key}>
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
