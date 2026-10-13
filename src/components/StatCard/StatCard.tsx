import * as React from "react";
import type { TablerIcon } from "@tabler/icons-react";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: TablerIcon;
  hint?: string;
}

/**
 * Compact KPI tile used by the role dashboards. Canon (constitution design
 * v4.0.0 §III/IV/V): `.tp-card` surface carrying the one ratified soft shadow,
 * 13px muted label (no uppercase, tracking 0), 700 36px/1 number, and no hover
 * lift — hovering deepens color, never elevation.
 */
export function StatCard({ label, value, icon: Icon, hint }: StatCardProps) {
  return (
    <div className="tp-card flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="tp-label">{label}</p>
        <p className="mt-1.5 text-[36px] font-bold leading-none text-tp-text">{value}</p>
        {hint ? <p className="tp-label mt-1.5">{hint}</p> : null}
      </div>
      {Icon ? (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-tp-sm bg-tp-tint-violet text-tp-ink-violet">
          <Icon className="h-[18px] w-[18px]" aria-hidden />
        </span>
      ) : null}
    </div>
  );
}
