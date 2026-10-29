export function WorkloadReflectionNotice({ hours }: { hours: number }) {
  return (
    <p className="rounded-[14px] bg-tp-tint-info px-4 py-2 text-[13px] font-medium text-tp-ink-info">
      Aktivitas yang baru dicatat akan tampil dalam ± {hours} jam.
    </p>
  );
}
