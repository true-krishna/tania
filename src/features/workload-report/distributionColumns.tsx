import type { ReactNode } from "react";
import { LoadStatusBadge } from "./LoadStatusBadge";
import { TtdLevelBadge } from "./TtdLevelBadge";
import type { DistributionDimension, DistributionNormalizedRow, DistributionRow } from "./types";
import { DIMENSION_LABELS } from "./types";

export type SortDir = "asc" | "desc";

export type SortKey =
  | "jumlahTalent"
  | "totalBacklog"
  | "totalTaskSubtask"
  | "availability"
  | "totalTimespent"
  | "fte"
  | "loadEstimate"
  | "ttdComp";

export type SortState = { dir: SortDir; key: SortKey } | null;

export type SortAccessor = (row: DistributionRow) => number | null;

export const SORT_ACCESSORS: Record<SortKey, SortAccessor> = {
  availability: (row) => row.availability,
  fte: (row) => row.fte,
  jumlahTalent: (row) => row.jumlahTalent,
  loadEstimate: (row) => row.loadEstimate,
  totalBacklog: (row) => row.totalBacklog,
  totalTaskSubtask: (row) => row.totalTaskSubtask,
  totalTimespent: (row) => (row.totalTimespent === null ? null : Number(row.totalTimespent)),
  ttdComp: (row) => row.ttdComp,
};

export type DistributionColumnDef<Row> = {
  alignRight?: boolean;
  header: string;
  key: string;
  render: (row: Row) => ReactNode;
  sortKey?: SortKey;
};

function percent(value: number | null): string {
  return value === null ? "—" : `${value}%`;
}

function normalizedMarker(row: DistributionRow): ReactNode {
  if (!row.isNormalized) return null;
  return (
    <span
      className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-tp-tint-sun px-1 text-[10px] font-bold text-tp-ink-sun"
      title="Ada aktivitas ternormalisasi"
    >
      N
    </span>
  );
}

export function standardColumns(
  dimension: DistributionDimension,
  canSeeCost: boolean,
): Array<DistributionColumnDef<DistributionRow>> {
  const columns: Array<DistributionColumnDef<DistributionRow>> = [
    {
      header: DIMENSION_LABELS[dimension],
      key: "nama",
      render: (row) => (
        <span className="flex items-center font-semibold text-tp-text">
          {row.nama}
          {normalizedMarker(row)}
        </span>
      ),
    },
    {
      alignRight: true,
      header: "Talent",
      key: "jumlahTalent",
      render: (row) => row.jumlahTalent,
      sortKey: "jumlahTalent",
    },
    {
      alignRight: true,
      header: "Backlog",
      key: "totalBacklog",
      render: (row) => row.totalBacklog,
      sortKey: "totalBacklog",
    },
    {
      alignRight: true,
      header: "Aktivitas",
      key: "totalTaskSubtask",
      render: (row) => row.totalTaskSubtask,
      sortKey: "totalTaskSubtask",
    },
    {
      alignRight: true,
      header: "Aktivitas/Talent",
      key: "taskSubtaskPerTalent",
      render: (row) => row.taskSubtaskPerTalent,
    },
    {
      alignRight: true,
      header: "Availability",
      key: "availability",
      render: (row) => percent(row.availability),
      sortKey: "availability",
    },
    {
      alignRight: true,
      header: "Jam tersedia",
      key: "totalAvailableTime",
      render: (row) => row.totalAvailableTime,
    },
    {
      alignRight: true,
      header: "Time spent",
      key: "totalTimespent",
      render: (row) => row.totalTimespent,
      sortKey: "totalTimespent",
    },
    {
      alignRight: true,
      header: "Beban (FTE)",
      key: "fte",
      render: (row) => percent(row.fte),
      sortKey: "fte",
    },
    {
      header: "Status beban",
      key: "statusLoad",
      render: (row) => <LoadStatusBadge status={row.statusLoad} />,
    },
    {
      alignRight: true,
      header: "Backlog/Talent",
      key: "backlogPerTalent",
      render: (row) => row.backlogPerTalent,
    },
    {
      alignRight: true,
      header: "Aktivitas w/ TS",
      key: "taskSubtaskWithTimespent",
      render: (row) => row.taskSubtaskWithTimespent,
    },
    {
      alignRight: true,
      header: "Training",
      key: "training",
      render: (row) => row.training,
    },
    {
      alignRight: true,
      header: "Rata-rata FTE",
      key: "avgFte",
      render: (row) => percent(row.avgFte),
    },
    {
      alignRight: true,
      header: "Assignment",
      key: "jmlAssignment",
      render: (row) => row.jmlAssignment,
    },
    {
      alignRight: true,
      header: "Est. time spent",
      key: "totalTimespentEstimate",
      render: (row) => row.totalTimespentEstimate ?? "—",
    },
    {
      alignRight: true,
      header: "Est. beban",
      key: "loadEstimate",
      render: (row) => percent(row.loadEstimate),
      sortKey: "loadEstimate",
    },
    {
      header: "Est. status",
      key: "statusLoadEstimate",
      render: (row) =>
        row.statusLoadEstimate ? <LoadStatusBadge status={row.statusLoadEstimate} /> : "—",
    },
    {
      alignRight: true,
      header: "TTD",
      key: "ttdComp",
      render: (row) => percent(row.ttdComp),
      sortKey: "ttdComp",
    },
    {
      header: "Level TTD",
      key: "compLvl",
      render: (row) => (row.compLvl ? <TtdLevelBadge level={row.compLvl} /> : "—"),
    },
  ];

  if (canSeeCost) {
    columns.push({
      alignRight: true,
      header: "Biaya talent",
      key: "totalCost",
      render: (row) => row.totalCost ?? "—",
    });
  }

  return columns;
}

export const NORMALIZED_COLUMNS: Array<DistributionColumnDef<DistributionNormalizedRow>> = [
  {
    header: "Entitas",
    key: "nama",
    render: (row) => <span className="font-semibold text-tp-text">{row.nama}</span>,
  },
  {
    alignRight: true,
    header: "Talent ternormalisasi",
    key: "jumlahTalent",
    render: (row) => row.jumlahTalent ?? "—",
  },
  {
    alignRight: true,
    header: "Aktivitas ternormalisasi",
    key: "jmlActivityNormalized",
    render: (row) => row.jmlActivityNormalized ?? "—",
  },
  {
    alignRight: true,
    header: "Total time spent",
    key: "totalTimespent",
    render: (row) => row.totalTimespent ?? "—",
  },
  {
    alignRight: true,
    header: "TS ternormalisasi/hari",
    key: "totalTimespentNormDay",
    render: (row) => row.totalTimespentNormDay ?? "—",
  },
];
