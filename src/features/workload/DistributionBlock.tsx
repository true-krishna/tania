"use client";

import * as React from "react";
import { DistributionRow } from "./DistributionRow";
import { LEGEND } from "./distributionSegments";
import type { DistributionDimension, DistributionRowData } from "./types";

const DIMENSIONS: { key: DistributionDimension; label: string }[] = [
  { key: "UNIT", label: "Unit" },
  { key: "CHAPTER", label: "Chapter" },
  { key: "PROJECT", label: "Proyek" },
];

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
