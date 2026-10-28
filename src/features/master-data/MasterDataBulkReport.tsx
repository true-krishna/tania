"use client";

import type { MergedImportReport } from "./useMasterDataImport";

type ReportEntry = { rowNumber: number; label: string };

type MasterDataBulkReportProps = {
  report: MergedImportReport;
  formatEntry: (entry: ReportEntry) => string;
  hint: string;
  stopPrefix: string;
};

export function MasterDataBulkReport({ report, formatEntry, hint, stopPrefix }: MasterDataBulkReportProps) {
  return (
    <div
      className="flex flex-col gap-2 rounded-lg border border-tp-line bg-tp-bg px-3 py-2 text-sm"
      role="status"
    >
      <p className="font-medium text-tp-text">
        {report.succeeded.length} baris berhasil
        {report.failed.length > 0 ? `, ${report.failed.length} gagal` : ""}
        {report.notExecuted.length > 0 ? `, ${report.notExecuted.length} belum dieksekusi` : ""}
        .
      </p>
      {report.stopReason ? (
        <p className="text-red-700" role="alert">
          {stopPrefix}: {report.stopReason}
        </p>
      ) : null}
      {report.failed.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {report.failed.map((row) => (
            <li className="text-red-700" key={row.rowNumber}>
              <span className="font-medium">{formatEntry(row)}</span>
              {" — "}
              {row.reason}
            </li>
          ))}
        </ul>
      ) : null}
      {report.notExecuted.length > 0 ? (
        <ul aria-label="Baris tidak dieksekusi" className="flex flex-col gap-1">
          {report.notExecuted.map((row) => (
            <li className="text-tp-muted" key={row.rowNumber}>
              {formatEntry(row)} — tidak dieksekusi.
            </li>
          ))}
        </ul>
      ) : null}
      {report.failed.length > 0 ? <p className="text-xs text-tp-muted">{hint}</p> : null}
    </div>
  );
}
