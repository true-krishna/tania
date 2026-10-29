import type { Metadata } from "next";
import { Suspense } from "react";
import { ReportSkeleton, TalentWorkloadView } from "@/features/workload-report";

export const metadata: Metadata = {
  title: "Workload Talent",
};

export default function WorkloadTalentPage() {
  return (
    <Suspense fallback={<ReportSkeleton variant="talent" />}>
      <TalentWorkloadView />
    </Suspense>
  );
}
