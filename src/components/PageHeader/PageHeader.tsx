import * as React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

/** Page-title role (constitution design v4.0.0 §III): `.tp-h1` — 700 clamp(30px,5vw,40px)/1.1. */
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="tp-h1">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm text-tp-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}