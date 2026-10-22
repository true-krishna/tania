"use client";

import * as React from "react";
import { WorkloadPageView, WorkloadSkeleton } from "@/features/workload";

export default function WorkloadPage() {
  return (
    <React.Suspense fallback={<WorkloadSkeleton />}>
      <WorkloadPageView />
    </React.Suspense>
  );
}
