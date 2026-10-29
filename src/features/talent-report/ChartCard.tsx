"use client";

import * as React from "react";
import { IconDownload } from "@tabler/icons-react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";

interface ChartCardProps {
  title: string;
  subtitle: string;
  onDownload?: () => void;
  children: React.ReactNode;
}

export function ChartCard({ title, subtitle, onDownload, children }: ChartCardProps) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="tp-h3">{title}</h2>
          <p className="tp-label">{subtitle}</p>
        </div>
        <Button disabled={!onDownload} onClick={onDownload} type="button" variant="secondary">
          <IconDownload aria-hidden="true" size={16} />
          Unduh PNG
        </Button>
      </div>
      <div className="flex min-h-64 flex-col">{children}</div>
    </Card>
  );
}
