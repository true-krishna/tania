"use client";

import { cn } from "@/lib/cn";
import * as React from "react";

type Variant = "primary" | "secondary" | "ghost";

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
