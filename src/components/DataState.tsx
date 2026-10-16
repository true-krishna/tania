import { Chip } from "@/components/Chip";

/**
 * Shared data states on the shipped canon (constitution design v4.0.0):
 * §IV progress uses `--tp-neutral`, §V `.tp-empty`, §IX tint+ink semantics.
 */

export function LoadingState({ label = "Memuat…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center rounded-tp-lg border border-tp-line bg-tp-surface p-6">
      <span className="flex items-center gap-2 text-sm text-tp-muted">
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-tp-neutral border-t-transparent"
          aria-hidden
        />
        {label}
      </span>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-tp-lg bg-tp-tint-peach px-5 py-4 text-sm text-tp-ink-peach" role="alert">
      {message}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-tp-lg border border-tp-line bg-tp-surface p-5">
      <p className="tp-empty">
        <strong>{message}</strong>
      </p>
    </div>
  );
}

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <Chip variant={active ? "success" : "neutral"} size="small" dot>
      {active ? "Aktif" : "Nonaktif"}
    </Chip>
  );
}
