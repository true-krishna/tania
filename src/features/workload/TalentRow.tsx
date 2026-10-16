import Link from "next/link";
import { IconChevronRight } from "@tabler/icons-react";
import { EMPLOYEE_DETAIL } from "@/lib/constants/routes";
import { LoadClassificationBadge } from "./LoadClassificationBadge";
import { LoadPercentageBar } from "./LoadPercentageBar";
import type { TalentSummary } from "./types";

function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

function percent(value: number | null): string {
  return value !== null ? `${value}%` : "—";
}

/**
 * Talent list item (design §4). The whole row is a link — overload is visible
 * on the row itself (peach badge + %), no detail open required. Collapses to a
 * two-line grid below 860px with the bar full-width (design §8).
 */
export function TalentRow({
  talent,
  secondary = "unit-role",
  barMax = 120,
}: {
  talent: TalentSummary;
  secondary?: "unit-role" | "role";
  barMax?: number;
}) {
  const sub = secondary === "role" ? talent.jobRoleName : `${talent.unitName} · ${talent.jobRoleName}`;
  const badge = talent.classification ? (
    <LoadClassificationBadge classification={talent.classification} />
  ) : null;

  return (
    <Link
      href={EMPLOYEE_DETAIL(talent.id)}
      className="grid grid-cols-[36px_1fr_auto] items-center gap-x-4 gap-y-3 rounded-[14px] border border-tp-line bg-tp-surface px-[18px] py-3.5 text-tp-text shadow-[0_1px_2px_rgba(16,26,71,0.06)] transition-colors hover:bg-tp-bg min-[860px]:grid-cols-[36px_minmax(150px,1.3fr)_minmax(140px,1.6fr)_56px_auto_20px]"
    >
      <span
        aria-hidden
        className="grid h-9 w-9 place-items-center rounded-full bg-tp-nav font-tp-display text-sm font-bold text-white"
      >
        {initialOf(talent.fullName)}
      </span>

      <span className="min-w-0">
        <span className="block truncate text-[15px] font-semibold leading-tight">
          {talent.fullName}
        </span>
        <span className="flex flex-wrap items-center gap-2 text-[12.5px] text-tp-muted">
          <span className="truncate">{sub}</span>
          <span className="min-[860px]:hidden">{badge}</span>
        </span>
      </span>

      <span className="text-right font-tp-display text-[17px] font-bold min-[860px]:hidden">
        {percent(talent.loadPercentage)}
      </span>

      <span className="col-span-3 min-w-[120px] min-[860px]:col-span-1">
        <LoadPercentageBar value={talent.loadPercentage} max={barMax} />
      </span>

      <span className="hidden text-right font-tp-display text-[17px] font-bold min-[860px]:block">
        {percent(talent.loadPercentage)}
      </span>

      <span className="hidden min-[860px]:block">{badge}</span>

      <span className="hidden text-tp-muted min-[860px]:grid min-[860px]:place-items-center">
        <IconChevronRight className="h-5 w-5" aria-hidden />
      </span>
    </Link>
  );
}
