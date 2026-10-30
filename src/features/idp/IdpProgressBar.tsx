export function IdpProgressBar({ completed, total }: { completed: number; total: number }) {
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return (
    <div
      aria-label={`Progres aksi ${completed} dari ${total}`}
      aria-valuemax={total}
      aria-valuemin={0}
      aria-valuenow={completed}
      className="h-2.5 w-full overflow-hidden rounded-full bg-tp-bg"
      role="meter"
    >
      <div className="h-full rounded-full bg-tp-brand-navy" style={{ width: `${percent}%` }} />
    </div>
  );
}
