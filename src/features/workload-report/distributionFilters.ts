import {
  SORT_ACCESSORS,
  type SortState,
} from "./distributionColumns";
import type {
  DistributionDimension,
  DistributionFilter,
  DistributionNormalizedRow,
  DistributionRow,
  DistributionTables,
} from "./types";

export type FilterKey =
  | "tribeId"
  | "productId"
  | "squadId"
  | "unitcode"
  | "statusLoad";

export type FilterOption = { label: string; value: string };

export const FILTER_SCOPE: Record<
  DistributionDimension,
  readonly FilterKey[]
> = {
  product: ["tribeId", "statusLoad"],
  squad: ["tribeId", "productId", "statusLoad"],
  talent: ["tribeId", "productId", "squadId", "unitcode", "statusLoad"],
  tribe: ["statusLoad"],
  unitcode: ["tribeId", "productId", "squadId", "statusLoad"],
};

export const EMPTY_FILTER: DistributionFilter = {
  productId: null,
  squadId: null,
  statusLoad: null,
  tribeId: null,
  unitcode: null,
};

export function scopeMatches(
  row: DistributionRow,
  filter: DistributionFilter,
  keys: readonly FilterKey[]
): boolean {
  return keys.every((key) => {
    if (key === "statusLoad") {
      return !filter.statusLoad || row.statusLoad === filter.statusLoad;
    }
    return !filter[key] || row.scope[key] === filter[key];
  });
}

export function normalizedScopeMatches(
  row: DistributionNormalizedRow,
  filter: DistributionFilter,
  keys: readonly FilterKey[]
): boolean {
  return keys
    .filter((key): key is Exclude<FilterKey, "statusLoad"> => key !== "statusLoad")
    .every((key) => !filter[key] || row.scope[key] === filter[key]);
}

export function uniqueOptions(
  rows: { id: string; nama: string }[]
): FilterOption[] {
  return rows.map((row) => ({ label: row.nama, value: row.id }));
}

export function sortRows(
  rows: DistributionRow[],
  sort: SortState
): DistributionRow[] {
  if (!sort) return rows;
  const accessor = SORT_ACCESSORS[sort.key];

  return [...rows].sort((first, second) => {
    const firstValue = accessor(first);
    const secondValue = accessor(second);
    if (firstValue === null && secondValue === null) return 0;
    if (firstValue === null) return 1;
    if (secondValue === null) return -1;
    const order = firstValue - secondValue;
    return sort.dir === "asc" ? order : -order;
  });
}

export function productFilterOptions(
  tables: DistributionTables,
  filter: DistributionFilter
): FilterOption[] {
  return uniqueOptions(
    tables.rows.product.filter(
      (row) => !filter.tribeId || row.scope.tribeId === filter.tribeId
    )
  );
}

export function squadFilterOptions(
  tables: DistributionTables,
  filter: DistributionFilter
): FilterOption[] {
  return uniqueOptions(
    tables.rows.squad.filter(
      (row) =>
        (!filter.tribeId || row.scope.tribeId === filter.tribeId) &&
        (!filter.productId || row.scope.productId === filter.productId)
    )
  );
}

export function unitcodeFilterOptions(
  rows: DistributionRow[],
  filter: DistributionFilter
): FilterOption[] {
  const options = new Map<string, FilterOption>();

  for (const row of rows) {
    const code = row.scope.unitcode;
    if (!code || options.has(code)) continue;
    if (filter.tribeId && row.scope.tribeId !== filter.tribeId) continue;
    if (filter.productId && row.scope.productId !== filter.productId) continue;
    if (filter.squadId && row.scope.squadId !== filter.squadId) continue;
    options.set(code, { label: code, value: code });
  }

  return [...options.values()];
}
