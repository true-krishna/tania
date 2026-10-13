import { IconChevronDown } from "@tabler/icons-react";
import { cn } from "@/lib/cn";
import * as React from "react";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className = "", ...rest }: SelectProps) {
  return (
    <div className="relative">
      {/* `pr-10!` memaksa ruang caret melewati `padding` unlayered `.tp-input`
       * (pola `p-0!` pada Card). Ikon menggantikan caret native tanpa
       * background-image, mengikuti gaya ikon outline 2px §V. */}
      <select className={cn("tp-input appearance-none pr-10!", className)} {...rest} />
      <IconChevronDown
        aria-hidden
        className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-tp-muted"
      />
    </div>
  );
}