import { IconAlertTriangle, IconRefresh } from "@tabler/icons-react";

export function ProfileErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      className="flex min-w-0 flex-wrap items-center gap-3 rounded-tp-lg bg-tp-tint-peach px-5 py-4 text-sm text-tp-ink-peach"
      role="alert"
    >
      <IconAlertTriangle aria-hidden className="h-5 w-5 shrink-0" />
      <p className="min-w-0 flex-1 font-semibold">{message}</p>
      {onRetry ? (
        <button
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-current px-3 text-[13px] font-semibold hover:bg-tp-surface/40"
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
