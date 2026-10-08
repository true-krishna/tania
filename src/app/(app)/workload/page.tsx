"use client";

import * as React from "react";
import { WorkloadPageView, WorkloadSkeleton } from "@/features/workload";

export default function WorkloadPage() {
  // `WorkloadPageView` reads `?period=` — the Suspense boundary keeps the
  // static shell renderable while the route is prerendered.
  return (
    <React.Suspense fallback={<WorkloadSkeleton />}>
      <WorkloadPageView />
    </React.Suspense>
  );
}
