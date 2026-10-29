import type { ReactNode } from "react";

export function ContractCycleSuccess({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
      {children}
    </p>
  );
}
