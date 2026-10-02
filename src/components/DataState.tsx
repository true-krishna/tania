export function LoadingState({ label = "Memuat…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center rounded-lg border border-board-border bg-board p-6 shadow-sm">
      <span className="flex items-center gap-2 text-sm text-zinc-500">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        {label}
      </span>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div
      className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm"
      role="alert"
    >
      {message}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-board p-8 text-center text-sm text-zinc-500 shadow-sm">
      {message}
    </div>
  );
}

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold ${
        active ? "bg-brand-100 text-brand-700" : "bg-zinc-100 text-zinc-600"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${active ? "bg-brand-600" : "bg-zinc-400"}`}
      />
      {active ? "Aktif" : "Nonaktif"}
    </span>
  );
}