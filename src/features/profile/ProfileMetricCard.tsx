import { IconAlertTriangle, IconRefresh } from "@tabler/icons-react";
import type * as React from "react";
import { cn } from "@/lib/cn";

export type MetricState = "loading" | "ready" | "unavailable" | "error";

export function ProfileMetricCard({
  hint,
  label,
  onRetry,
  state,
  value,
}: {
  hint: string;
  label: string;
  onRetry?: () => void;
  state: MetricState;
  value?: React.ReactNode;
}) {
  const failed = state === "error";
  let body: React.ReactNode;

  if (state === "loading") {
    body = (
      <>
        <span className="sr-only">{`Memuat ${label}`}</span>
        <div aria-hidden className="mt-2 h-9 w-16 animate-pulse rounded-tp-sm bg-tp-bg" />
      </>
    );
  } else if (state === "ready") {
    body = <p className="mt-1.5 text-[36px] font-bold leading-none text-tp-text">{value}</p>;
  } else {
    body = (
      <p
        aria-label={`${label} tidak tersedia`}
        className="mt-1.5 text-[36px] font-bold leading-none text-tp-muted"
      >
        —
      </p>
    );
  }

  return (
    <div className="tp-card min-w-0 border-t-4" style={{ borderTopColor: "var(--tp-brand-navy)" }}>
      <p className="tp-label min-w-0 break-words">{label}</p>
      {body}
      <p
        className={cn(
          "mt-2 flex min-w-0 items-start gap-1.5 text-[13px] leading-5",
          failed ? "text-tp-ink-peach" : "text-tp-muted",
        )}
      >
        {failed ? <IconAlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" /> : null}
        <span className="min-w-0 break-words">{hint}</span>
      </p>
      {failed && onRetry ? (
        <button
          className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-tp-brand-red-ink hover:underline"
          onClick={onRetry}
          type="button"
        >
          <IconRefresh aria-hidden className="h-4 w-4" />
          Coba lagi
        </button>
      ) : null}
    </div>
  );
}
