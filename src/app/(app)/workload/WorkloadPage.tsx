"use client";

import * as React from "react";
import { WorkloadSkeleton } from "@/features/workload";
import { WorkloadLanding } from "./WorkloadLanding";

export default function WorkloadPage() {
  return (
    <React.Suspense fallback={<WorkloadSkeleton />}>
      <WorkloadLanding />
    </React.Suspense>
  );
}
