"use client";

import { ErrorState, LoadingState } from "@/components/DataState";
import { useCvProfile } from "@/features/cv/useCvProfile";
import { EmptyNote } from "./EmptyNote";
import { ReadOnlyCv } from "./ReadOnlyCv";

export function EmployeeCvContent({ employeeId }: { employeeId: string }) {
  const { status, data, error } = useCvProfile(employeeId);

  if (status === "loading") return <LoadingState label="Memuat CV…" />;
  if (status === "error") return <ErrorState message={error ?? "Gagal memuat CV."} />;
  if (!data) return <EmptyNote message="Talent ini belum memiliki profil CV." />;
  return <ReadOnlyCv cv={data} />;
}
