import type { ReactNode } from "react";
import { Card } from "@/components/Card";

type CvSectionCardProps = {
  children: ReactNode;
  description?: string;
  title: string;
};

export function CvSectionCard({
  children,
  description,
  title,
}: CvSectionCardProps) {
  return (
    <Card className="flex flex-col gap-3">
      <div>
        <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
        {description ? (
          <p className="text-xs text-zinc-500">{description}</p>
        ) : null}
      </div>
      {children}
    </Card>
  );
}
