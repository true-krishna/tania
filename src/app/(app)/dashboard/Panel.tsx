import type { ReactNode } from "react";
import { Card } from "@/components/Card";

export function Panel({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={`flex flex-col gap-4 ${className ?? ""}`}>
      <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
      {children}
    </Card>
  );
}
