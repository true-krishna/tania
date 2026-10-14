import * as React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  search?: React.ReactNode;
  filters?: React.ReactNode;
}

/**
 * Header halaman utama (TAN-184): judul di kiri, aksi utama di kanan; baris
 * kontrol di bawahnya menampatkan searchbox di kiri dan filter di kanan.
 * Page-title role (constitution design v4.0.0 §III): `.tp-h1` — 700 clamp(30px,5vw,40px)/1.1.
 */
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
          {search ? (
            <div className="flex min-w-0 flex-1 justify-start">{search}</div>
          ) : null}
          {filters ? <div className="ml-auto flex flex-wrap items-center gap-3">{filters}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
