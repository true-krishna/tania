"use client";

import * as React from "react";
import { IconDownload } from "@tabler/icons-react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";

interface ChartCardProps {
  title: string;
  /** Subjudul total — mis. `n = 25` (FR-16). */
  subtitle: string;
  /** Aksi "Unduh PNG" — disambungkan ke `downloadChart` (T027); tanpa handler, tombol nonaktif. */
  onDownload?: () => void;
  children: React.ReactNode;
}

/**
 * T019 — kartu grafik laporan: judul + subjudul total (n = …), slot chart,
 * tombol "Unduh PNG" (US4; aksi di T027 — unduh satu per satu per grafik).
 */
export function ChartCard({ title, subtitle, onDownload, children }: ChartCardProps) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
          <p className="text-xs text-zinc-500">{subtitle}</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={onDownload}
          disabled={!onDownload}
        >
          <IconDownload size={16} aria-hidden="true" />
          Unduh PNG
        </Button>
      </div>
      <div className="flex min-h-64 flex-col">{children}</div>
    </Card>
  );
}
