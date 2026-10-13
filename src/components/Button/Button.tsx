"use client";

import { cn } from "@/lib/cn";
import * as React from "react";

type Variant = "primary" | "secondary" | "ghost";

/**
 * Canon buttons (constitution design v4.0.0 §V): the shipped `.tp-btn` outline
 * is the default treatment, and `.tp-btn--primary` is the single strongest
 * action per area (§II). Canon ships no separate ghost treatment, so `ghost`
 * resolves to the same outline — its old borderless look is retired.
 */
const VARIANTS: Record<Variant, string> = {
  primary: "tp-btn tp-btn--primary",
  secondary: "tp-btn",
  ghost: "tp-btn",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = "primary", className = "", ...rest }: ButtonProps) {
  return (
    <button
      className={cn(
        VARIANTS[variant],
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...rest}
    />
  );
}