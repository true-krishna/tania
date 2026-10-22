"use client";

import * as React from "react";
import { WorkloadPageView, WorkloadSkeleton } from "@/features/workload";
import { TalentOwnWorkloadView } from "@/features/workload-report";
import { useSessionRole } from "@/lib/auth/guard";

function WorkloadLanding() {
  const role = useSessionRole();

  // Umpan balik pemilik produk (TAN-227): workload untuk level user menampilkan
  // tampilan yang sama dengan detail talent workload; role lain tetap memakai
  // halaman workload yang ada.
  if (role === "TALENT") {
    return <TalentOwnWorkloadView />;
  }
  return <WorkloadPageView />;
}

export default function WorkloadPage() {
<<<<<<< HEAD
  // Kedua view membaca `?period=` — Suspense menjaga shell statis tetap
  // bisa di-prerender.
=======
>>>>>>> 9612b5d3b454060ad87dfe9e6beee7f0badd9cab
  return (
    <React.Suspense fallback={<WorkloadSkeleton />}>
      <WorkloadLanding />
    </React.Suspense>
  );
}