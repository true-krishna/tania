import { cn } from "@/lib/cn";
import * as React from "react";

type InputProps = React.ComponentPropsWithRef<"input">;

export function Input({ className = "", ...rest }: InputProps) {
  return <input className={cn("tp-input", className)} {...rest} />;
}