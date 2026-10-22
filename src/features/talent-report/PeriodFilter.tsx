"use client";

import * as React from "react";
import { Button } from "@/components/Button";
import { Select } from "@/components/Select";
import type {
  TalentReportPeriodInput as TalentReportPeriod,
  TalentReportRange,
} from "@/generated/graphql/types";

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

const MONTH_OPTIONS = MONTH_NAMES.map((name, index) => ({
  value: String(index + 1).padStart(2, "0"),
  label: name,
}));

export function formatMonthLabel(month: YearMonth): string {
  const [year, monthNumber] = month.split("-").map(Number);
  return `${MONTH_NAMES[monthNumber - 1] ?? month} ${year}`;
}

const yearOf = (month: YearMonth) => month.slice(0, 4);
const monthOf = (month: YearMonth) => month.slice(5, 7);

function monthOptions(bound: YearMonth | undefined, current: YearMonth, edge: "min" | "max") {
  if (bound === undefined || yearOf(bound) !== yearOf(current)) return MONTH_OPTIONS;
  const limit = Number(monthOf(bound));
  return MONTH_OPTIONS.filter((option) =>
    edge === "min" ? Number(option.value) >= limit : Number(option.value) <= limit,
  );
}

interface PeriodFilterProps {
  range: TalentReportRange | null;
  value: TalentReportPeriod;
  onApply: (period: TalentReportPeriod) => void;
}

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
            aria-label="Bulan mulai"
            disabled={!range}
            onChange={(e) => setStartMonth(`${yearOf(draft.startMonth)}-${e.target.value}`)}
            options={monthOptions(range?.startMonth, draft.startMonth, "min")}
            value={monthOf(draft.startMonth)}
          />
          <Select
            aria-label="Tahun mulai"
            disabled={!range}
            onChange={(e) => setStartMonth(`${e.target.value}-${monthOf(draft.startMonth)}`)}
            options={yearOptions}
            value={yearOf(draft.startMonth)}
          />
        </span>
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold text-tp-text">
        Sampai
        <span className="flex items-center gap-2">
          <Select
            aria-label="Bulan akhir"
            disabled={!range}
            onChange={(e) => setEndMonth(`${yearOf(draft.endMonth)}-${e.target.value}`)}
            options={monthOptions(range?.endMonth, draft.endMonth, "max")}
            value={monthOf(draft.endMonth)}
          />
          <Select
            aria-label="Tahun akhir"
            disabled={!range}
            onChange={(e) => setEndMonth(`${e.target.value}-${monthOf(draft.endMonth)}`)}
            options={yearOptions}
            value={yearOf(draft.endMonth)}
          />
        </span>
      </label>
      <Button disabled={!range || !dirty} onClick={() => onApply(draft)} type="button">
        Terapkan
      </Button>
    </div>
  );
}
