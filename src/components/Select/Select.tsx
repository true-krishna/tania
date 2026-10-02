import * as React from "react";

const CONTROL =
  "w-full rounded-md border border-surface-border bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand-100";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className = "", ...rest }: SelectProps) {
  return <select className={`${CONTROL} ${className}`} {...rest} />;
}