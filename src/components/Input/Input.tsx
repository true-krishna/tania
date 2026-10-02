import { cn } from "@/lib/cn";
import * as React from "react";

const CONTROL =
  "w-full rounded-md border border-surface-border bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand-100";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", ...rest }: InputProps) {
  return <input className={cn(CONTROL, className)} {...rest} />;
}