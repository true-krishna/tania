import { Card } from "@/components/Card";
import { Table, type TableColumn } from "@/components/Table";
import { GRAND_TOTAL } from "./types";
import type { AnalyticsTablesData, LoggedVsEstimatedRow, TtdComplianceRow } from "./types";

const ESTIMATE_COLUMNS = [
  { key: "overload", header: "Overload" },
  { key: "stretch", header: "Stretch" },
  { key: "fit", header: "Fit" },
  { key: "underload", header: "Underload" },
  { key: "undefinedTimespent", header: "Undefined Time Spent" },
  { key: "undefinedActivity", header: "Undefined Activity" },
  { key: "total", header: "Grand Total" },
] as const;

const TTD_COLUMNS = [
  { key: "notAchieved", header: "Need Improvement" },
  { key: "lowAchieved", header: "Fair" },
  { key: "achieved", header: "Good" },
  { key: "highAchieved", header: "Very Good" },
  { key: "total", header: "Total" },
] as const;

function cell(value: number | null): string {
  return String(value ?? 0);
}

function analyticsColumns<Row extends { statusLoad: string }>(
  columns: readonly { key: string; header: string }[],
): TableColumn<Row>[] {
  return [
    {
      key: "statusLoad",
      title: "Status beban",
      rowHeader: true,
      className: "text-left font-medium",
      render: (_value, row) => row.statusLoad,
    },
    ...columns.map((col) => ({
      key: col.key,
      title: col.header,
      align: "right" as const,
      render: (_value: unknown, row: Row) =>
        cell((row as unknown as Record<string, number | null>)[col.key]),
    })),
  ];
}

const ROW_CLASSNAME = (row: { statusLoad: string }) =>
  row.statusLoad === GRAND_TOTAL ? "font-semibold" : undefined;

const LOGGED_COLUMNS = analyticsColumns<LoggedVsEstimatedRow>(ESTIMATE_COLUMNS);
const TTD_TABLE_COLUMNS = analyticsColumns<TtdComplianceRow>(TTD_COLUMNS);

export function AnalyticsTables({ analytics }: { analytics: AnalyticsTablesData }) {
  return (
    <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
      <Card className="flex flex-col gap-4">
        <div>
          <h2 className="tp-h3">Actual & Estimated Workload</h2>
          <p className="tp-label mt-1">Jumlah talent per status beban aktual (baris) dan estimasi (kolom).</p>
        </div>
        <Table
          caption="Tabel actual dan estimated workload"
          columns={LOGGED_COLUMNS}
          dataSource={analytics.loggedVsEstimated}
          minWidth={640}
          rowClassName={ROW_CLASSNAME}
          rowKey={(row) => row.statusLoad}
        />
      </Card>

      <Card className="flex flex-col gap-4">
        <div>
          <h2 className="tp-h3">Actual Workload dengan Level Kepatuhan TTD</h2>
          <p className="tp-label mt-1">Jumlah talent per status beban aktual dan level kepatuhan TTD.</p>
        </div>
        <Table
          caption="Tabel kepatuhan TTD"
          columns={TTD_TABLE_COLUMNS}
          dataSource={analytics.ttdCompliance}
          rowClassName={ROW_CLASSNAME}
          rowKey={(row) => row.statusLoad}
        />
      </Card>
    </div>
  );
}
