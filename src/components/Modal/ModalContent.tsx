"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export type ModalContentProps = React.ComponentPropsWithoutRef<"div">;

export function ModalContent({ className, ...rest }: ModalContentProps) {
  return <div className={cn("min-h-0 flex-1 overflow-y-auto px-5 py-4", className)} {...rest} />;
}
