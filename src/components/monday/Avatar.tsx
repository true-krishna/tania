import * as React from "react";

interface AvatarProps {
  initials: string;
}

const COLORS = [
  "bg-brand-100 text-brand-800",
  "bg-emerald-100 text-emerald-800",
  "bg-amber-100 text-amber-800",
  "bg-sky-100 text-sky-800",
  "bg-rose-100 text-rose-800",
];

export function Avatar({ initials }: AvatarProps) {
  const color = COLORS[initials.charCodeAt(0) % COLORS.length];
  return (
    <span
      aria-hidden
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold ${color}`}
    >
      {initials}
    </span>
  );
}