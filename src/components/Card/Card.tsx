import { cn } from "@/lib/cn";
import * as React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
}

/**
 * Canon card (constitution design v4.0.0 §IV/V): shipped `.tp-card` — surface,
 * 1px `--tp-line`, 20px radius, 20px padding, the one ratified soft shadow.
 * `p-0!` keeps the `padded={false}` API working: components.css is unlayered,
 * so a plain utility would lose to `.tp-card`'s padding.
 */
export function Card({ padded = true, className = "", ...rest }: CardProps) {
  return <div className={cn("tp-card", !padded && "p-0!", className)} {...rest} />;
}