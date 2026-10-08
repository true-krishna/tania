import * as React from "react";
import { cn } from "@/lib/cn";

/** `\.tp-chip` treatments (design spec TAN-124 §5.2). */
export type ChipTone = "mint" | "peach" | "violet" | "neutral";

const TONES: Record<ChipTone, string> = {
  mint: "bg-tp-tint-mint text-tp-ink-mint",
  peach: "bg-tp-tint-peach text-tp-ink-peach",
  violet: "bg-tp-tint-violet text-tp-ink-violet",
  // Neutral chip is flagged [non-canonical] in the spec: bg --tp-bg, muted ink, 1px line.
  neutral: "border border-tp-line bg-tp-bg text-tp-muted",
};

export function Chip({
  tone = "neutral",
  className,
  children,
}: {
  tone?: ChipTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-[3px] text-[12.5px] font-semibold",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
