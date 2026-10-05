import { cn } from "@/lib/cn";
import * as React from "react";

const CONTROL =
  "w-full rounded-md border border-surface-border bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm transition-colors hover:border-brand focus:border-brand";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className = "", ...rest }: SelectProps) {
  return <select className={cn(CONTROL, className)} {...rest} />;
}