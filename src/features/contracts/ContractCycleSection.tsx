import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type ContractCycleSectionProps = {
  children?: ReactNode;
  notice?: string;
  success?: ReactNode;
  title: string;
};

export function ContractCycleSection({
  children,
  notice,
  success,
  title,
}: ContractCycleSectionProps) {
  return (
    <section
      className={cn("flex flex-col border-t border-board-border pt-4", success ? "gap-2" : "gap-3")}
    >
      <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
      {notice ? (
        <p className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
          {notice}
        </p>
      ) : null}
      {success}
      {children}
    </section>
  );
}

export function ContractCycleSuccess({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
      {children}
    </p>
  );
}
