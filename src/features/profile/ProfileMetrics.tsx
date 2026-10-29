import type * as React from "react";
import { ProfileMetricCard, type MetricState } from "./ProfileMetricCard";

export interface ProfileMetric {
  hint: string;
  id: string;
  label: string;
  onRetry?: () => void;
  state: MetricState;
  value?: React.ReactNode;
}

export function ProfileMetrics({ metrics }: { metrics: readonly ProfileMetric[] }) {
  return (
    <section
      aria-label="Metrik profil"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      {metrics.map((metric) => (
        <ProfileMetricCard
          hint={metric.hint}
          key={metric.id}
          label={metric.label}
          onRetry={metric.onRetry}
          state={metric.state}
          value={metric.value}
        />
      ))}
    </section>
  );
}
