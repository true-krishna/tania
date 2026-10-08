function Block({ className = "", dark = false }: { className?: string; dark?: boolean }) {
  return (
    <div
      className={`rounded-[10px] ${dark ? "bg-white/18" : "border border-tp-line bg-tp-bg"} ${className}`}
    />
  );
}

/**
 * Loading skeleton (design §5.7, [non-canonical]). Static — no shimmer — so
 * `prefers-reduced-motion` is trivially respected; the visible text carries the
 * status for assistive tech and the skeletons stay `aria-hidden`.
 */
export function WorkloadSkeleton({ label = "Memuat data workload…" }: { label?: string }) {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <p role="status" className="text-sm text-tp-muted">
        {label}
      </p>
      <div aria-hidden className="flex items-center justify-between gap-10 rounded-[20px] bg-tp-nav p-6">
        <div className="flex flex-col gap-3">
          <Block dark className="h-3.5 w-40" />
          <Block dark className="h-9 w-28" />
          <Block dark className="h-3.5 w-56" />
        </div>
        <Block dark className="h-[70px] w-[120px]" />
      </div>
      <div aria-hidden className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col gap-4 rounded-[20px] border border-tp-line bg-tp-surface p-5">
            <Block className="h-4 w-36" />
            <Block className="h-14" />
            <Block className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
