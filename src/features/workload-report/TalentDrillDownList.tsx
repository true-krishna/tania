"use client";

import { LoadStatusBadge } from "./LoadStatusBadge";
import type { DistributionRow, DistributionTables } from "./types";

export function TalentDrillDownList({
  row,
  tables,
}: {
  row: DistributionRow;
  tables: DistributionTables;
}) {
  const scopeKeys = (
    Object.keys(row.scope) as Array<keyof typeof row.scope>
  ).filter((key) => row.scope[key] !== null);
  const talents = tables.rows.talent.filter((talent) =>
    scopeKeys.every((key) => talent.scope[key] === row.scope[key])
  );

  if (talents.length === 0) {
    return (
      <p className="text-sm text-tp-muted">
        Tidak ada talent dalam entitas ini.
      </p>
    );
  }

  return (
    <ul
      aria-label={`Talent dalam ${row.nama}`}
      className="flex flex-col divide-y divide-tp-line"
    >
      {talents.map((talent) => (
        <li
          className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm first:pt-0 last:pb-0"
          key={talent.id}
        >
          <span className="font-medium text-tp-text">{talent.nama}</span>
          <span className="flex items-center gap-3 text-tp-muted">
            <span>Beban {talent.fte}%</span>
            <LoadStatusBadge status={talent.statusLoad} />
          </span>
        </li>
      ))}
    </ul>
  );
}
