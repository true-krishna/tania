import * as React from "react";
import type { TablerIcon } from "@tabler/icons-react";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: TablerIcon;
  hint?: string;
}

export function StatCard({ label, value, icon: Icon, hint }: StatCardProps) {
  return (
    <div className="tp-card flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="tp-label">{label}</p>
        <p className="mt-1.5 text-[36px] font-bold leading-none text-tp-text">{value}</p>
        {hint ? <p className="tp-label mt-1.5">{hint}</p> : null}
      </div>
      {Icon ? (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-tp-sm bg-tp-tint-info text-tp-ink-info">
          <Icon aria-hidden className="h-[18px] w-[18px]" />
        </span>
      ) : null}
    </div>
  );
}
