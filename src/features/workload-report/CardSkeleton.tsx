import type { ReactNode } from "react";

export function CardSkeleton({ children }: { children: ReactNode }) {
  return (
    <div
      aria-hidden
      className="flex flex-col gap-4 rounded-[20px] border border-tp-line bg-tp-surface p-5"
    >
      {children}
    </div>
  );
}
