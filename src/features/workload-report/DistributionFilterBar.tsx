"use client";

import { Select } from "@/components/Select";
import {
  FILTER_SCOPE,
  productFilterOptions,
  squadFilterOptions,
  unitcodeFilterOptions,
  uniqueOptions,
  type FilterKey,
} from "./distributionFilters";
import {
  WORKLOAD_STATUSES,
  type DistributionDimension,
  type DistributionFilter,
  type DistributionTables,
} from "./types";

type DistributionFilterBarProps = {
  dimension: DistributionDimension;
  filter: DistributionFilter;
  normalized: boolean;
  onChange: (key: FilterKey, value: string) => void;
  tables: DistributionTables;
};

const STATUS_OPTIONS = [
  { label: "Semua status", value: "" },
  ...WORKLOAD_STATUSES.map((status) => ({
    label: status as string,
    value: status as string,
  })),
];

export function DistributionFilterBar({
  dimension,
  filter,
  normalized,
  onChange,
  tables,
}: DistributionFilterBarProps) {
  const filterKeys = FILTER_SCOPE[dimension];
  const productOptions = productFilterOptions(tables, filter);
  const squadOptions = squadFilterOptions(tables, filter);
  const unitcodeOptions = unitcodeFilterOptions(tables.rows.unitcode, filter);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filterKeys.includes("tribeId") ? (
        <label className="flex items-center gap-1.5 text-[13px] text-tp-muted">
          Tribe
          <Select
            aria-label="Filter tribe"
            className="h-9 w-44"
            onChange={(event) => onChange("tribeId", event.target.value)}
            options={[{ label: "Semua tribe", value: "" }, ...uniqueOptions(tables.rows.tribe)]}
            value={filter.tribeId ?? ""}
          />
        </label>
      ) : null}
      {filterKeys.includes("productId") ? (
        <label className="flex items-center gap-1.5 text-[13px] text-tp-muted">
          Product
          <Select
            aria-label="Filter product"
            className="h-9 w-44"
            onChange={(event) => onChange("productId", event.target.value)}
            options={[{ label: "Semua product", value: "" }, ...productOptions]}
            value={filter.productId ?? ""}
          />
        </label>
      ) : null}
      {filterKeys.includes("squadId") ? (
        <label className="flex items-center gap-1.5 text-[13px] text-tp-muted">
          Squad
          <Select
            aria-label="Filter squad"
            className="h-9 w-44"
            onChange={(event) => onChange("squadId", event.target.value)}
            options={[{ label: "Semua squad", value: "" }, ...squadOptions]}
            value={filter.squadId ?? ""}
          />
        </label>
      ) : null}
      {filterKeys.includes("unitcode") ? (
        <label className="flex items-center gap-1.5 text-[13px] text-tp-muted">
          Unit Code
          <Select
            aria-label="Filter unit code"
            className="h-9 w-44"
            onChange={(event) => onChange("unitcode", event.target.value)}
            options={[{ label: "Semua unit code", value: "" }, ...unitcodeOptions]}
            value={filter.unitcode ?? ""}
          />
        </label>
      ) : null}
      {!normalized ? (
        <label className="flex items-center gap-1.5 text-[13px] text-tp-muted">
          Status beban
          <Select
            aria-label="Filter status beban"
            className="h-9 w-48"
            onChange={(event) => onChange("statusLoad", event.target.value)}
            options={STATUS_OPTIONS}
            value={filter.statusLoad ?? ""}
          />
        </label>
      ) : null}
    </div>
  );
}
