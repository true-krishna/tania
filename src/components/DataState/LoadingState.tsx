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
