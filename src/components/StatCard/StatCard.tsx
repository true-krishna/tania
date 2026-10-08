import * as React from "react";
import type { TablerIcon } from "@tabler/icons-react";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: TablerIcon;
  hint?: string;
}

/** Compact KPI tile used by the role dashboards. */
export function StatCard({ label, value, icon: Icon, hint }: StatCardProps) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-board-border bg-board p-4 shadow-sm transition-shadow hover:shadow">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
        <p className="mt-1.5 text-2xl font-semibold tracking-tight text-zinc-900">{value}</p>
        {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
      </div>
      {Icon ? (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <Icon className="h-[18px] w-[18px]" aria-hidden />
        </span>
      ) : null}
    </div>
  );
}