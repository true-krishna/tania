"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { useMyEmployeeId } from "@/features/employees/useMyEmployee";
import { EMPLOYEE_DETAIL } from "@/lib/constants/routes";

export function OwnEmployeeRedirect() {
  const router = useRouter();
  const { status, data, error } = useMyEmployeeId();

  React.useEffect(() => {
    if (data) router.replace(EMPLOYEE_DETAIL(data));
  }, [data, router]);

  if (status === "error") return <ErrorState message={error ?? "Gagal memuat data."} />;
  if (status === "ready" && data === null) {
    return <EmptyState message="Akun Anda belum tertaut ke data karyawan." />;
  }
  return <LoadingState />;
}
