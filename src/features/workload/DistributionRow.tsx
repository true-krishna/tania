"use client";

import * as React from "react";
import { StackedBar } from "./StackedBar";
import { TalentRow } from "./TalentRow";
import type { DistributionRowData } from "./types";

export function DistributionRow({ row }: { row: DistributionRowData }) {
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
