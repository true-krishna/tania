import { Suspense } from "react";
import { ReportSkeleton, TalentWorkloadView } from "@/features/workload-report";

export default function WorkloadTalentPage() {
  return (
    <Suspense fallback={<ReportSkeleton variant="talent" />}>
      <TalentWorkloadView />
    </Suspense>
  );
}