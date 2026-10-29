"use client";

import { WorkloadPageView } from "@/features/workload";
import { TalentOwnWorkloadView } from "@/features/workload-report";
import { useSessionRole } from "@/lib/auth/guard";

export function WorkloadLanding() {
  const role = useSessionRole();

  if (role === "TALENT") {
    return <TalentOwnWorkloadView />;
  }
  return <WorkloadPageView />;
}
