function Block({ className = "", dark = false }: { className?: string; dark?: boolean }) {
  return (
    <div
      className={`rounded-[10px] ${dark ? "bg-white/18" : "border border-tp-line bg-tp-bg"} ${className}`}
    />
  );
}

export function WorkloadSkeleton({ label = "Memuat data workload…" }: { label?: string }) {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <p className="text-sm text-tp-muted" role="status">
        {label}
      </p>
      <div
        aria-hidden
        className="flex items-center justify-between gap-10 rounded-[20px] bg-tp-nav p-6"
      >
        <div className="flex flex-col gap-3">
          <Block className="h-3.5 w-40" dark />
          <Block className="h-9 w-28" dark />
          <Block className="h-3.5 w-56" dark />
        </div>
        <Block className="h-[70px] w-[120px]" dark />
      </div>
      <div aria-hidden className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            className="flex flex-col gap-4 rounded-[20px] border border-tp-line bg-tp-surface p-5"
            key={i}
          >
            <Block className="h-4 w-36" />
            <Block className="h-14" />
            <Block className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
