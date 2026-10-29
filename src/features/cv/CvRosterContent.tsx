"use client";

import { ErrorState, LoadingState } from "@/components/DataState";
import type { CvFieldsFragment } from "@/generated/graphql";
import type { QueryStatus } from "@/lib/apollo/toQueryState";
import { EmptyNote } from "./EmptyNote";
import { ReadOnlyCv } from "./ReadOnlyCv";

export function CvRosterContent({
  selectedEmployeeId,
  status,
  data,
  error,
}: {
  selectedEmployeeId: string;
  status: QueryStatus;
  data: CvFieldsFragment | undefined;
  error: string | null;
}) {
  if (!selectedEmployeeId) return null;
  if (status === "loading") return <LoadingState label="Memuat CV…" />;
  if (status === "error") return <ErrorState message={error ?? "Gagal memuat CV."} />;
  if (!data) return <EmptyNote message="Talent ini belum memiliki profil CV." />;
  return <ReadOnlyCv cv={data} />;
}
