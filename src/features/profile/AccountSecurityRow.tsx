export function AccountSecurityRow({
  label,
  reason,
  value,
}: {
  label: string;
  reason: string;
  value?: string;
}) {
  const filled = Boolean(value);

  return (
    <div className="flex min-w-0 flex-col gap-0.5 border-t border-tp-line py-3 first:border-t-0 first:pt-0 last:pb-0">
      <p className="text-sm font-semibold text-tp-text">{label}</p>
      <p
        className={
          filled ? "break-words text-[13px] text-tp-text" : "break-words text-[13px] text-tp-muted"
        }
      >
        {filled ? value : `— · ${reason}`}
      </p>
    </div>
  );
}
