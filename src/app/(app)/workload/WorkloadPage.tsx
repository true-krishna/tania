"use client";

import * as React from "react";
import { WorkloadPageView, WorkloadSkeleton } from "@/features/workload";
import { TalentOwnWorkloadView } from "@/features/workload-report";
import { useSessionRole } from "@/lib/auth/guard";

function WorkloadLanding() {
  const role = useSessionRole();

  if (role === "TALENT") {
    return <TalentOwnWorkloadView />;
  }
  return <WorkloadPageView />;
}

export default function WorkloadPage() {
  return (
    <React.Suspense fallback={<WorkloadSkeleton />}>
      <WorkloadLanding />
    </React.Suspense>
  );
}
