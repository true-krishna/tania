export function SectionHeader({ label, title }: { label?: string; title: string }) {
  return (
    <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-2">
      <h2 className="tp-h3 min-w-0 break-words">{title}</h2>
      {label ? <span className="tp-label">{label}</span> : null}
    </div>
  );
}
