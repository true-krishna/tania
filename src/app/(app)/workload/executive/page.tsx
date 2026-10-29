import type { Metadata } from "next";
import { Suspense } from "react";
import { ExecutiveReportView } from "@/features/workload-report";
import { ReportSkeleton } from "@/features/workload-report";

export const metadata: Metadata = {
  title: "Workload — Overview",
};

export default function WorkloadExecutivePage() {
  return (
    <Suspense fallback={<ReportSkeleton variant="executive" />}>
      <ExecutiveReportView />
    </Suspense>
  );
}
