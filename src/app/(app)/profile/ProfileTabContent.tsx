"use client";

import type { CvFieldsFragment } from "@/generated/graphql";
import type { MyIdp } from "@/features/idp/talent/useMyIdp";
import { AssignmentsSection } from "@/features/profile/AssignmentsSection";
import { ContractsSection } from "@/features/profile/ContractsSection";
import { IdpSection } from "@/features/profile/IdpSection";
import { ProfileErrorState } from "@/features/profile/ProfileErrorState";
import { ProfilePanelSkeleton } from "@/features/profile/ProfilePanelSkeleton";
import { SkillsCvSection } from "@/features/profile/SkillsCvSection";
import { SummarySection } from "@/features/profile/SummarySection";
import type {
  ProfileEmployee,
  ProfileHistory,
  ProfileSession,
} from "@/features/profile/useProfile";
import { WorkloadSection } from "@/features/profile/WorkloadSection";
import type { RefetchableQueryState } from "@/lib/apollo/toQueryState";

export type ProfileTab =
  "ringkasan" | "keahlian" | "kontrak" | "assignment" | "workload" | "pengembangan";

interface ProfileTabContentProps {
  cv: RefetchableQueryState<CvFieldsFragment | undefined>;
  history: RefetchableQueryState<ProfileHistory>;
  idp: RefetchableQueryState<MyIdp | undefined>;
  profile: RefetchableQueryState<ProfileEmployee | undefined> & {
    session: ProfileSession | undefined;
  };
  selectedTab: ProfileTab;
}

export function ProfileTabContent({
  cv,
  history,
  idp,
  profile,
  selectedTab,
}: ProfileTabContentProps) {
  if (selectedTab === "workload") return <WorkloadSection />;
  if (selectedTab === "pengembangan") return <IdpSection idp={idp} />;
  if (selectedTab === "keahlian") return <SkillsCvSection cv={cv} />;
  if (selectedTab === "ringkasan") {
    return (
      <SummarySection
        employee={profile.data}
        error={profile.error}
        onRetry={profile.refetch}
        session={profile.session}
        status={profile.status}
      />
    );
  }

  if (history.status === "loading") {
    return <ProfilePanelSkeleton label="Memuat riwayat kontrak dan assignment…" />;
  }
  if (history.status === "error") {
    return (
      <ProfileErrorState
        message={history.error ?? "Gagal memuat riwayat kontrak dan assignment."}
        onRetry={history.refetch}
      />
    );
  }

  if (selectedTab === "kontrak") {
    return <ContractsSection contracts={history.data?.contracts ?? []} />;
  }
  return <AssignmentsSection assignments={history.data?.assignments ?? []} />;
}
