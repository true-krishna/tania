import * as React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
}

export function Card({ padded = true, className = "", ...rest }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-board-border bg-board shadow-sm ${padded ? "p-5" : ""} ${className}`}
      {...rest}
    />
  );
}