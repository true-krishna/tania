import { cn } from "@/lib/cn";
import * as React from "react";

interface AvatarProps {
  initials: string;
}

const COLORS = [
  "bg-brand-50 text-brand-700",
  "bg-brand-100 text-brand-700",
  "bg-brand-100 text-brand-800",
  "bg-brand-200 text-brand-800",
  "bg-brand-200 text-brand-900",
];

export function Avatar({ initials }: AvatarProps) {
  const color = COLORS[initials.charCodeAt(0) % COLORS.length];
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold",
        color,
      )}
    >
      {initials}
    </span>
  );
}