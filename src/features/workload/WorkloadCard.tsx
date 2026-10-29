import * as React from "react";
import { cn } from "@/lib/cn";

export function WorkloadCard({
  title,
  action,
  className,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-[20px] border border-tp-line bg-tp-surface p-5", className)}>
      <div className="mb-3.5 flex flex-wrap items-baseline justify-between gap-2.5">
        <h3 className="font-tp-display text-[17px] font-bold text-tp-text">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}
