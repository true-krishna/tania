import { cn } from "@/lib/cn";
import * as React from "react";

type InputProps = React.ComponentPropsWithRef<"input">;

/** Canon input (constitution design v4.0.0 §V): shipped `.tp-input` — pill, 44px, 1px `--tp-line`. */
export function Input({ className = "", ...rest }: InputProps) {
  return <input className={cn("tp-input", className)} {...rest} />;
}