import { Suspense } from "react";
import { ExecutiveReportView } from "@/features/workload-report";
import { ReportSkeleton } from "@/features/workload-report";

export default function WorkloadExecutivePage() {
  return (
    <Suspense fallback={<ReportSkeleton variant="executive" />}>
      <ExecutiveReportView />
    </Suspense>
  );
}