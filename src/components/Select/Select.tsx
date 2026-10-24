import { IconChevronDown } from "@tabler/icons-react";
import { cn } from "@/lib/cn";
import * as React from "react";

export type SelectOption = {
  label: React.ReactNode;
  value: string;
};

type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> & {
  options: readonly SelectOption[];
};

export function Select({ className = "", options, value, ...rest }: SelectProps) {
  return (
    <div className={cn("relative h-11 min-w-0 text-sm", className)}>
      <select
        className="tp-select"
        data-empty={value === "" || undefined}
        value={value}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <IconChevronDown
        aria-hidden
        className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-tp-muted"
      />
    </div>
  );
}