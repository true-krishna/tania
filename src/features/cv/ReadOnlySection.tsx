import type { ReactNode } from "react";
import { Card } from "@/components/Card";

export function ReadOnlySection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <Card className="flex flex-col gap-2">
      <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
      {children}
    </Card>
  );
}
