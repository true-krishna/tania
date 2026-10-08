import { cn } from "@/lib/cn";

/**
 * Load bar (design spec §5.1). Scale is 0–120% with a 100% tick, because load
 * can exceed capacity and the overflow must stay readable — the fill stays
 * neutral (`--tp-neutral`) and the badge carries the status colour.
 */
export function LoadPercentageBar({
  value,
  max = 120,
  label,
  className,
}: {
  /** Server-provided load percentage; `null` renders an empty bar (never a fake 0). */
  value: number | null;
  max?: number;
  label?: string;
  className?: string;
}) {
  const defined = value !== null;
  const clamped = defined ? Math.min(Math.max(value, 0), max) : 0;

  return (
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={defined ? value : undefined}
      aria-label={label ?? (defined ? `Beban ${value} persen` : "Beban tidak terdefinisi")}
      className={cn("relative h-2 rounded-full bg-tp-line", className)}
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
