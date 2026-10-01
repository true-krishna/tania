/**
 * Shared presentational states for data-driven client pages (mock or live).
 * Keeps loading / error / empty rendering consistent across feature pages.
 */
export function LoadingState({ label = "Memuat…" }: { label?: string }) {
  return (
    <p className="rounded-md border border-zinc-200 bg-white p-4 text-sm text-zinc-500">
      {label}
    </p>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <p
      className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700"
      role="alert"
    >
      {message}
    </p>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-md border border-zinc-200 bg-white p-4 text-sm text-zinc-500">
      {message}
    </p>
  );
}

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={
        active
          ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
          : "rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600"
      }
    >
      {active ? "Aktif" : "Nonaktif"}
    </span>
  );
}