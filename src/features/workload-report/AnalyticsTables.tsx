import { Card } from "@/components/Card";
import { GRAND_TOTAL } from "./types";
import type { AnalyticsTablesData } from "./types";

/**
 * Dua tabel analitik executive (TAN-232): Logged vs Estimated dan TTD
 * Compliance. Baris tanpa data tampil sebagai 0 (bukan kosong), baris Grand
 * Total ikut dari data.
 */
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

export function AnalyticsTables({ analytics }: { analytics: AnalyticsTablesData }) {
  return (
    <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
      <Card className="flex flex-col gap-4">
        <div>
          <h2 className="tp-h3">Actual & Estimated Workload</h2>
          <p className="tp-label mt-1">Jumlah talent per status beban aktual (baris) dan estimasi (kolom).</p>
        </div>
        <div className="table-panel">
          <div className="table-scroll">
            <table className="w-full min-w-[640px]">
              <caption className="sr-only">Tabel actual dan estimated workload</caption>
              <thead>
                <tr>
                  <th scope="col" className="text-left">
                    Status beban
                  </th>
                  {ESTIMATE_COLUMNS.map((col) => (
                    <th key={col.key} scope="col" className="text-right">
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analytics.loggedVsEstimated.map((row) => (
                  <tr key={row.statusLoad} className={row.statusLoad === GRAND_TOTAL ? "font-semibold" : undefined}>
                    <th scope="row" className="text-left font-medium">
                      {row.statusLoad}
                    </th>
                    {ESTIMATE_COLUMNS.map((col) => (
                      <td key={col.key} className="text-right">
                        {cell(row[col.key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <div>
          <h2 className="tp-h3">Actual Workload dengan Level Kepatuhan TTD</h2>
          <p className="tp-label mt-1">Jumlah talent per status beban aktual dan level kepatuhan TTD.</p>
        </div>
        <div className="table-panel">
          <div className="table-scroll">
            <table className="w-full min-w-[560px]">
              <caption className="sr-only">Tabel kepatuhan TTD</caption>
              <thead>
                <tr>
                  <th scope="col" className="text-left">
                    Status beban
                  </th>
                  {TTD_COLUMNS.map((col) => (
                    <th key={col.key} scope="col" className="text-right">
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analytics.ttdCompliance.map((row) => (
                  <tr key={row.statusLoad} className={row.statusLoad === GRAND_TOTAL ? "font-semibold" : undefined}>
                    <th scope="row" className="text-left font-medium">
                      {row.statusLoad}
                    </th>
                    {TTD_COLUMNS.map((col) => (
                      <td key={col.key} className="text-right">
                        {cell(row[col.key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}
