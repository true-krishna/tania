import { cn } from "@/lib/cn";

export function LoadPercentageBar({
  value,
  max = 120,
  label,
  className,
}: {
  value: number | null;
  max?: number;
  label?: string;
  className?: string;
}) {
  const defined = value !== null;
  const clamped = defined ? Math.min(Math.max(value, 0), max) : 0;

  return (
    <div
      aria-label={label ?? (defined ? `Beban ${value} persen` : "Beban tidak terdefinisi")}
      aria-valuemax={max}
      aria-valuemin={0}
      aria-valuenow={defined ? value : undefined}
      className={cn("relative h-2 rounded-full bg-tp-line", className)}
      role="meter"
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 rounded-full bg-tp-neutral"
        style={{ width: `${(clamped / max) * 100}%` }}
      />
      <span
        aria-hidden
        className="absolute -bottom-[3px] -top-[3px] w-[1.5px] bg-tp-text"
        style={{ left: `${(100 / max) * 100}%`, opacity: 0.45 }}
      />
    </div>
  );
}
