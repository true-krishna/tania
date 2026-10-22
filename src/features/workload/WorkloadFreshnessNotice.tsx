import { IconWifi } from "@tabler/icons-react";
import { cn } from "@/lib/cn";
import { formatUpdatedAt } from "./formatUpdatedAt";
import type { WorkloadFreshness } from "./types";

export function WorkloadFreshnessNotice({
  freshness,
  onRetry,
}: {
  freshness: WorkloadFreshness;
  onRetry?: () => void;
}) {
  const shell = "rounded-[14px] px-4 py-2.5 text-[13px]";

  if (freshness.sourceStatus === "UNAVAILABLE") {
    return (
      <div
        className={cn(shell, "flex flex-wrap items-start gap-2.5 border border-tp-tint-peach bg-tp-tint-peach font-medium text-tp-ink-peach")}
        role="status"
      >
        <IconWifi aria-hidden className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <strong className="block font-semibold">Tidak dapat menghubungi sumber data WAD.</strong>
          <span>
            Menampilkan angka terakhir yang diketahui ({formatUpdatedAt(freshness.lastUpdatedAt)}) sebagai
            data lama.
          </span>
        </div>
        {onRetry ? (
          <button
            className="rounded-full border-[1.5px] border-tp-ink-peach px-4 py-1.5 text-[13px] font-semibold text-tp-ink-peach transition-colors hover:bg-tp-surface"
            onClick={onRetry}
            type="button"
          >
            Coba lagi
          </button>
        ) : null}
      </div>
    );
  }

  if (freshness.isStale) {
    return (
      <p
        className={cn(shell, "flex flex-wrap items-center gap-2.5 border border-tp-tint-peach bg-tp-tint-peach font-medium text-tp-ink-peach")}
        role="status"
      >
        <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-tp-ink-peach" />
        Data lama — terakhir diperbarui {formatUpdatedAt(freshness.lastUpdatedAt)}
        {freshness.staleAfterHours !== null ? ` (melewati batas ${freshness.staleAfterHours} jam)` : ""}.
      </p>
    );
  }

  return (
    <p
      className={cn(shell, "flex flex-wrap items-center gap-2.5 border border-tp-line bg-tp-surface text-tp-muted")}
      role="status"
    >
      <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-tp-mint-ink" />
      Data WAD diperbarui {formatUpdatedAt(freshness.lastUpdatedAt)}
    </p>
  );
}

export function WorkloadReflectionNotice({ hours }: { hours: number }) {
  return (
    <p className="rounded-[14px] bg-tp-tint-info px-4 py-2 text-[13px] font-medium text-tp-ink-info">
      Aktivitas yang baru dicatat akan tampil dalam ± {hours} jam.
    </p>
  );
}
