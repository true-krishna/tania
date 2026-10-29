"use client";

import { ErrorState, LoadingState } from "@/components/DataState";
import {
  AssignmentsSection,
  ContractsSection,
  IdpSection,
  PersonalInfoSection,
} from "@/features/profile";
import type { ProfileEmployee, useProfileHistory } from "@/features/profile";
import { WorkloadSection } from "@/features/profile/WorkloadSection";

type ProfileTab = "personal" | "contracts" | "assignments" | "workload" | "idp";

type HistoryState = ReturnType<typeof useProfileHistory>;

export function ProfileTabContent({
  selectedTab,
  status,
  error,
  employee,
  history,
}: {
  selectedTab: ProfileTab;
  status: "loading" | "ready" | "error";
  error: string | null;
  employee: ProfileEmployee | undefined;
  history: HistoryState;
}) {
  if (selectedTab === "workload") return <WorkloadSection />;
  if (selectedTab === "idp") return <IdpSection />;
  if (status === "loading") return <LoadingState />;
  if (status === "error") return <ErrorState message={error ?? "Gagal memuat profil."} />;
  if (!employee) return <PersonalInfoSection employee={undefined} />;

  if (selectedTab === "contracts") {
    if (history.status === "loading") return <LoadingState />;
    if (history.status === "error") {
      return <ErrorState message={history.error ?? "Gagal memuat riwayat kontrak."} />;
    }
    return <ContractsSection contracts={history.data?.contracts ?? []} />;
  }

  if (selectedTab === "assignments") {
    if (history.status === "loading") return <LoadingState />;
    if (history.status === "error") {
      return <ErrorState message={history.error ?? "Gagal memuat riwayat assignment."} />;
    }
    return <AssignmentsSection assignments={history.data?.assignments ?? []} />;
  }

  return <PersonalInfoSection employee={employee} />;
}
