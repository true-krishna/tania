import { cn } from "@/lib/cn";
import * as React from "react";

interface AvatarProps {
  /** Display name; initials are derived from it when no photo is available. */
  name: string;
  /** Photo URL. When absent the avatar falls back to the name's initials. */
  src?: string | null;
  className?: string;
}

// Canon tint+ink pairs (§IX): the raw accent fills are never text colours, so
// the avatar cycles the shipped tints with their text-safe ink variants.
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

/**
 * User avatar: the photo when one is available, otherwise the name's initials
 * on a tinted brand chip. The photo is optional because the API's `User` model
 * has no photo field yet.
 */
export function Avatar({ name, src, className }: AvatarProps) {
  const label = name.trim() || "?";

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote user photo, not a build-time asset
      <img
        src={src}
        alt={label}
        className={cn(
          "inline-flex h-8 w-8 shrink-0 rounded-full object-cover",
          className,
        )}
      />
    );
  }

  const tint = TINTS[
    [...label].reduce((sum, char) => sum + char.charCodeAt(0), 0) % TINTS.length
  ];

  return (
    <span
      role="img"
      aria-label={label}
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold",
        tint,
        className,
      )}
    >
      {initialsOf(label)}
    </span>
  );
}