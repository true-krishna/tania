import { cn } from "@/lib/cn";
import * as React from "react";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

/** Canon select (constitution design v4.0.0 §V): same recipe as `.tp-input`. */
export function Select({ className = "", ...rest }: SelectProps) {
  return <select className={cn("tp-input", className)} {...rest} />;
}