import type { ReactNode } from "react";

export function ProfileDataGroup({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="border-t border-tp-line pt-4 first:border-t-0 first:pt-0">
      <h3 className="text-sm font-semibold text-tp-text">{title}</h3>
      <dl className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</dl>
    </div>
  );
}
