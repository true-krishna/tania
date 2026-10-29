import { Chip } from "@/components/Chip";

export function LoadingState({ label = "Memuat…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center rounded-tp-lg border border-tp-line bg-tp-surface p-6">
      <span className="flex items-center gap-2 text-sm text-tp-muted">
        <span
          aria-hidden
          className="h-4 w-4 animate-spin rounded-full border-2 border-tp-neutral border-t-transparent"
        />
        {label}
      </span>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div
      className="rounded-tp-lg bg-tp-tint-peach px-5 py-4 text-sm text-tp-ink-peach"
      role="alert"
    >
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
    <Chip dot size="small" variant={active ? "success" : "neutral"}>
      {active ? "Aktif" : "Nonaktif"}
    </Chip>
  );
}
