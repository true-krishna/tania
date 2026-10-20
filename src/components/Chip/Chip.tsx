import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Chip treatments on the shipped canon (`.tp-chip`, constitution design §IX):
 * semantic tint+ink token pairs, pill radius, Nunito Sans 600. Status is never
 * colour-only — always pair the colour with a label (and optionally a dot).
 */
export type ChipVariant = "neutral" | "info" | "success" | "warning" | "danger";
export type ChipSize = "small" | "medium" | "large";

/**
 * Treatment class per variant, exported so a non-`Chip` element (e.g. the
 * assistant's suggestion buttons) can carry the same tokens instead of copying
 * them — one owner per variant value (constitution design §IX, T047).
 */
export const CHIP_VARIANTS: Record<ChipVariant, string> = {
  info: "bg-tp-tint-info text-tp-ink-info",
  success: "bg-tp-tint-mint text-tp-ink-mint",
  warning: "bg-tp-tint-sun text-tp-ink-sun",
  danger: "bg-tp-tint-peach text-tp-ink-peach",
  // Neutral is non-canonical in the spec: canvas bg, muted ink, 1px line.
  neutral: "border border-tp-line bg-tp-bg text-tp-muted",
};

const SIZES: Record<ChipSize, string> = {
  small: "gap-1.5 px-2.5 py-0.5 text-xs",
  medium: "gap-1.5 px-3 py-1 text-[12.5px]",
  large: "gap-1.5 px-3.5 py-1.5 text-sm",
};

const DOT_SIZES: Record<ChipSize, string> = {
  small: "h-1.5 w-1.5",
  medium: "h-1.5 w-1.5",
  large: "h-2 w-2",
};

interface ChipProps {
  variant?: ChipVariant;
  size?: ChipSize;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Chip({
  variant = "neutral",
  size = "medium",
  dot = false,
  className,
  children,
}: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold",
        SIZES[size],
        CHIP_VARIANTS[variant],
        className,
      )}
    >
      {dot ? (
        <span className={cn("shrink-0 rounded-full bg-current", DOT_SIZES[size])} aria-hidden />
      ) : null}
      {children}
    </span>
  );
}
