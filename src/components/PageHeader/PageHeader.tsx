import * as React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  search?: React.ReactNode;
  filters?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions, search, filters }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="tp-h1">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-tp-muted">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      {search || filters ? (
        <div className="flex flex-wrap items-center gap-3">
          {search ? <div className="flex min-w-0 flex-1 justify-start">{search}</div> : null}
          {filters ? (
            <div className="ml-auto flex flex-wrap items-center gap-3">{filters}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
