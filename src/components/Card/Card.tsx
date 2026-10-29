import { cn } from "@/lib/cn";
import * as React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
}

export function Card({ padded = true, className = "", ...rest }: CardProps) {
  return <div className={cn("tp-card", !padded && "p-0!", className)} {...rest} />;
}
