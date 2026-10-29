import { cn } from "@/lib/cn";
import * as React from "react";

interface AvatarProps {
  name: string;
  src?: string | null;
  className?: string;
}

const TINTS = [
  "bg-tp-tint-info text-tp-ink-info",
  "bg-tp-tint-mint text-tp-ink-mint",
  "bg-tp-tint-sun text-tp-ink-sun",
  "bg-tp-tint-peach text-tp-ink-peach",
];

function initialsOf(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  return initials || "?";
}

export function Avatar({ name, src, className }: AvatarProps) {
  const label = name.trim() || "?";

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote user photo, not a build-time asset
      <img
        alt={label}
        className={cn("inline-flex h-8 w-8 shrink-0 rounded-full object-cover", className)}
        src={src}
      />
    );
  }

  const tint = TINTS[[...label].reduce((sum, char) => sum + char.charCodeAt(0), 0) % TINTS.length];

  return (
    <span
      aria-label={label}
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold",
        tint,
        className,
      )}
      role="img"
    >
      {initialsOf(label)}
    </span>
  );
}
