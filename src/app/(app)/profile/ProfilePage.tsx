"use client";

import * as React from "react";
import { useMyCvProfile } from "@/features/cv/useMyCvProfile";
import { useMyIdp } from "@/features/idp/talent/useMyIdp";
import { buildProfileMetrics } from "@/features/profile/profileMetrics";
import { ProfileHero } from "@/features/profile/ProfileHero";
import { ProfileMetrics } from "@/features/profile/ProfileMetrics";
import { ProfileTabs, type ProfileTabItem } from "@/features/profile/ProfileTabs";
import { useProfile, useProfileHistory, type ProfileContract } from "@/features/profile";
import type { QueryStatus } from "@/lib/apollo/toQueryState";
import { useModuleAccess } from "@/lib/auth/access";
import type { Module } from "@/lib/auth/matrix";
import { ProfileTabContent, type ProfileTab } from "./ProfileTabContent";

const PROFILE_TABS: readonly { id: ProfileTab; label: string; module?: Module }[] = [
  { id: "ringkasan", label: "Ringkasan" },
  { id: "keahlian", label: "Keahlian & CV", module: "cv" },
  { id: "kontrak", label: "Kontrak", module: "contracts" },
  { id: "assignment", label: "Assignment", module: "assignments" },
  { id: "workload", label: "Workload" },
  { id: "pengembangan", label: "Pengembangan saya", module: "idp" },
];

function findActiveContract(contracts: readonly ProfileContract[]): ProfileContract | undefined {
  return contracts.find((contract) => contract.status === "ACTIVE");
}

function resolveContractHint(canRead: boolean, status: QueryStatus): string {
  if (!canRead) return "Butuh akses modul Kontrak.";
  if (status === "loading") return "Memuat kontrak…";
  if (status === "error") return "Gagal memuat kontrak.";
  return "Kontrak aktif belum tersedia.";
}

export default function ProfilePage() {
  const cvAccess = useModuleAccess("cv");
  const contractsAccess = useModuleAccess("contracts");
  const assignmentsAccess = useModuleAccess("assignments");
  const idpAccess = useModuleAccess("idp");
  const profile = useProfile();
  const history = useProfileHistory(contractsAccess.canRead || assignmentsAccess.canRead);
  const cv = useMyCvProfile(cvAccess.canRead);
  const idp = useMyIdp(idpAccess.canRead);
  const [tab, setTab] = React.useState<ProfileTab>("ringkasan");

  const tabs: ProfileTabItem<ProfileTab>[] = PROFILE_TABS.filter((item) => {
    if (item.module === "cv") return cvAccess.canRead;
    if (item.module === "contracts") return contractsAccess.canRead;
    if (item.module === "assignments") return assignmentsAccess.canRead;
    if (item.module === "idp") return idpAccess.canRead;
    return true;
  });
  const selectedTab = tabs.some((item) => item.id === tab) ? tab : "ringkasan";
  const contract = findActiveContract(history.data?.contracts ?? []);
  const contractHint = resolveContractHint(contractsAccess.canRead, history.status);
  const metrics = buildProfileMetrics({
    assignmentsCanRead: assignmentsAccess.canRead,
    cv,
    cvCanRead: cvAccess.canRead,
    history,
    idp,
    idpCanRead: idpAccess.canRead,
  });

  return (
    <section className="flex min-w-0 flex-col gap-4">
      <ProfileHero
        contract={contract}
        contractHint={contractHint}
        employee={profile.data}
        error={profile.error}
        onRetry={profile.refetch}
        session={profile.session}
        status={profile.status}
      />
      <ProfileMetrics metrics={metrics} />
      <ProfileTabs items={tabs} onSelect={setTab} selected={selectedTab} />
      <div className="flex min-w-0 flex-col gap-4">
        {tabs.map((item) => (
          <div
            aria-labelledby={`profile-tab-${item.id}`}
            className="min-w-0"
            hidden={item.id !== selectedTab}
            id={`profile-panel-${item.id}`}
            key={item.id}
            role="tabpanel"
            tabIndex={0}
          >
            <ProfileTabContent
              cv={cv}
              history={history}
              idp={idp}
              profile={profile}
              selectedTab={item.id}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
