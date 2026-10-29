"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export type ModalActionsProps = React.ComponentPropsWithoutRef<"footer">;

export function ModalActions({ className, ...rest }: ModalActionsProps) {
  return (
    <footer
      className={cn(
        "flex shrink-0 items-center justify-end gap-2 border-t border-tp-line px-5 py-4",
        className,
      )}
      {...rest}
    />
  );
}
