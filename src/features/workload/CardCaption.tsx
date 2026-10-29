import type { ReactNode } from "react";

export function CardCaption({ children }: { children: ReactNode }) {
  return <span className="text-[13px] text-tp-muted">{children}</span>;
}
