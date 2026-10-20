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

/** Pilihan bulan `01`–`12` (nilai `YYYY-MM` disusun dari tahun + bulan). */
const MONTH_OPTIONS = MONTH_NAMES.map((name, index) => ({
  value: String(index + 1).padStart(2, "0"),
  label: name,
}));

/** `2025-01` → "Januari 2025" (label bulan-tahun, FR-11). */
export function formatMonthLabel(month: YearMonth): string {
  const [year, monthNumber] = month.split("-").map(Number);
  return `${MONTH_NAMES[monthNumber - 1] ?? month} ${year}`;
}

/** `2025-01` → `2025` / `01`. */
const yearOf = (month: YearMonth) => month.slice(0, 4);
const monthOf = (month: YearMonth) => month.slice(5, 7);

/**
 * Pilihan bulan untuk satu sisi filter. Saat tahunnya sama dengan tahun batas
 * rentang, hanya bulan yang masih di dalam rentang yang ditawarkan.
 */
function monthOptions(bound: YearMonth | undefined, current: YearMonth, edge: "min" | "max") {
  if (bound === undefined || yearOf(bound) !== yearOf(current)) return MONTH_OPTIONS;
  const limit = Number(monthOf(bound));
  return MONTH_OPTIONS.filter((option) =>
    edge === "min" ? Number(option.value) >= limit : Number(option.value) <= limit,
  );
}

interface PeriodFilterProps {
  /** Batas filter `talentReportRange` (FR-11); `null` = belum tersedia. */
  range: TalentReportRange | null;
  /** Periode terpakai (default: seluruh rentang — diatur `useTalentReport`). */
  value: TalentReportPeriod;
  onApply: (period: TalentReportPeriod) => void;
}

/**
 * T021 — filter rentang bulan-tahun (FR-11). Bulan dan tahun dipilih terpisah
 * supaya daftar pilihannya tidak memanjang mengikuti rentang (rentang bisa
 * mencakup puluhan tahun sejak kontrak paling awal). Pilihan tetap dibatasi
 * `talentReportRange`; "Terapkan" memicu satu refetch (FR-12/SC-04).
 */
export function PeriodFilter({ range, value, onApply }: PeriodFilterProps) {
  const [draft, setDraft] = React.useState<TalentReportPeriod>(value);

  const years = React.useMemo(() => {
    if (!range) return [];
    const first = Number(yearOf(range.startMonth));
    const last = Number(yearOf(range.endMonth));
    return Array.from({ length: last - first + 1 }, (_, index) => String(first + index));
  }, [range]);

  const yearOptions = years.map((year) => ({ value: year, label: year }));

  function setStartMonth(startMonth: YearMonth) {
    const floored = range && startMonth < range.startMonth ? range.startMonth : startMonth;
    setDraft((prev) => ({
      startMonth: floored,
      endMonth: floored > prev.endMonth ? floored : prev.endMonth,
    }));
  }

  function setEndMonth(endMonth: YearMonth) {
    const capped = range && endMonth > range.endMonth ? range.endMonth : endMonth;
    setDraft((prev) => ({
      startMonth: capped < prev.startMonth ? capped : prev.startMonth,
      endMonth: capped,
    }));
  }

  const dirty = draft.startMonth !== value.startMonth || draft.endMonth !== value.endMonth;

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm font-semibold text-tp-text">
        Mulai
        <span className="flex items-center gap-2">
          <Select
            value={monthOf(draft.startMonth)}
            onChange={(e) => setStartMonth(`${yearOf(draft.startMonth)}-${e.target.value}`)}
            disabled={!range}
            aria-label="Bulan mulai"
            options={monthOptions(range?.startMonth, draft.startMonth, "min")}
          />
          <Select
            value={yearOf(draft.startMonth)}
            onChange={(e) => setStartMonth(`${e.target.value}-${monthOf(draft.startMonth)}`)}
            disabled={!range}
            aria-label="Tahun mulai"
            options={yearOptions}
          />
        </span>
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold text-tp-text">
        Sampai
        <span className="flex items-center gap-2">
          <Select
            value={monthOf(draft.endMonth)}
            onChange={(e) => setEndMonth(`${yearOf(draft.endMonth)}-${e.target.value}`)}
            disabled={!range}
            aria-label="Bulan akhir"
            options={monthOptions(range?.endMonth, draft.endMonth, "max")}
          />
          <Select
            value={yearOf(draft.endMonth)}
            onChange={(e) => setEndMonth(`${e.target.value}-${monthOf(draft.endMonth)}`)}
            disabled={!range}
            aria-label="Tahun akhir"
            options={yearOptions}
          />
        </span>
      </label>
      <Button type="button" onClick={() => onApply(draft)} disabled={!range || !dirty}>
        Terapkan
      </Button>
    </div>
  );
}
