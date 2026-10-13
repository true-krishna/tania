"use client";

import * as React from "react";
import { Button } from "@/components/Button";
import { Select } from "@/components/Select";
import type {
  TalentReportPeriodInput as TalentReportPeriod,
  TalentReportRange,
} from "@/generated/graphql/types";

/** Bulan format `YYYY-MM` (scalar `String` di SDL). */
type YearMonth = string;

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

/** Daftar bulan inklusif `YYYY-MM` dari `startMonth` s.d. `endMonth`. */
export function monthRange(startMonth: YearMonth, endMonth: YearMonth): YearMonth[] {
  const months: YearMonth[] = [];
  let [year, month] = startMonth.split("-").map(Number);
  const [endYear, endMonthNumber] = endMonth.split("-").map(Number);
  while (year < endYear || (year === endYear && month <= endMonthNumber)) {
    months.push(`${year}-${String(month).padStart(2, "0")}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return months;
}

/** `2025-01` → "Januari 2025" (label bulan-tahun, FR-11). */
export function formatMonthLabel(month: YearMonth): string {
  const [year, monthNumber] = month.split("-").map(Number);
  return `${MONTH_NAMES[monthNumber - 1] ?? month} ${year}`;
}

interface PeriodFilterProps {
  /** Batas filter `talentReportRange` (FR-11); `null` = belum tersedia. */
  range: TalentReportRange | null;
  /** Periode terpakai (default: seluruh rentang — diatur `useTalentReport`). */
  value: TalentReportPeriod;
  onApply: (period: TalentReportPeriod) => void;
}

/**
 * T021 — filter rentang bulan-tahun (FR-11). Pilihan dibatasi
 * `talentReportRange`; "Terapkan" memicu satu refetch (FR-12/SC-04).
 */
export function PeriodFilter({ range, value, onApply }: PeriodFilterProps) {
  const [draft, setDraft] = React.useState<TalentReportPeriod>(value);

  const months = React.useMemo(
    () => (range ? monthRange(range.startMonth, range.endMonth) : []),
    [range],
  );

  function setStartMonth(startMonth: YearMonth) {
    setDraft((prev) => ({
      startMonth,
      endMonth: startMonth > prev.endMonth ? startMonth : prev.endMonth,
    }));
  }

  function setEndMonth(endMonth: YearMonth) {
    setDraft((prev) => ({
      startMonth: endMonth < prev.startMonth ? endMonth : prev.startMonth,
      endMonth,
    }));
  }

  const dirty = draft.startMonth !== value.startMonth || draft.endMonth !== value.endMonth;

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm font-semibold text-tp-text">
        Mulai
        <Select
          value={draft.startMonth}
          onChange={(e) => setStartMonth(e.target.value)}
          disabled={!range}
          aria-label="Bulan mulai"
        >
          {months.map((month) => (
            <option key={month} value={month}>
              {formatMonthLabel(month)}
            </option>
          ))}
        </Select>
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold text-tp-text">
        Sampai
        <Select
          value={draft.endMonth}
          onChange={(e) => setEndMonth(e.target.value)}
          disabled={!range}
          aria-label="Bulan akhir"
        >
          {months.map((month) => (
            <option key={month} value={month}>
              {formatMonthLabel(month)}
            </option>
          ))}
        </Select>
      </label>
      <Button
        type="button"
        onClick={() => onApply(draft)}
        disabled={!range || !dirty}
      >
        Terapkan
      </Button>
    </div>
  );
}
