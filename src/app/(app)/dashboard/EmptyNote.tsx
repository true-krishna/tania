import type { ReactNode } from "react";

export function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="text-sm text-zinc-500">{children}</p>;
}
