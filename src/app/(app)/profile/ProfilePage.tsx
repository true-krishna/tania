"use client";

import type { ProfileContract } from "@/features/profile";
import { AccountSecurityCard } from "@/features/profile/AccountSecurityCard";
import { ContractsSection } from "@/features/profile/ContractsSection";
import { RecentChangesCard } from "@/features/profile/RecentChangesCard";
import { buildProfileMetrics } from "@/features/profile/profileMetrics";
import { ProfileHero } from "@/features/profile/ProfileHero";
import { ProfileMetrics } from "@/features/profile/ProfileMetrics";
import { SummarySection } from "@/features/profile/SummarySection";
import { useProfile, useProfileHistory } from "@/features/profile";
import { useMyAccountSecurity, useMyProfileMetrics } from "@/features/profile/useSelfProfile";
import { useModuleAccess } from "@/lib/auth/access";

function findActiveContract(contracts: readonly ProfileContract[]): ProfileContract | undefined {
  return contracts.find((contract) => contract.status === "ACTIVE");
}

export default function ProfilePage() {
  const contractsAccess = useModuleAccess("contracts");
  const assignmentsAccess = useModuleAccess("assignments");
  const profile = useProfile();
  const history = useProfileHistory(contractsAccess.canRead || assignmentsAccess.canRead);
  const metricsQuery = useMyProfileMetrics();
  const security = useMyAccountSecurity();

  const contract = findActiveContract(history.data?.contracts ?? []);
  const metrics = buildProfileMetrics({ metrics: metricsQuery });
  const contractHint = contractsAccess.canRead
    ? "Kontrak aktif belum tersedia."
    : "Rincian kontrak dikelola Chapter/Operation.";

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
      <div className="grid grid-cols-1 gap-3 min-[860px]:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <SummarySection
          employee={profile.data}
          error={profile.error}
          onRetry={profile.refetch}
          status={profile.status}
        />
        <div className="flex min-w-0 flex-col gap-3">
          <AccountSecurityCard
            email={profile.data?.email ?? profile.session?.email}
            security={security}
          />
          <RecentChangesCard />
        </div>
      </div>
      <ContractsSection
        contracts={history.data?.contracts ?? []}
        error={history.error}
        onRetry={history.refetch}
        status={history.status}
      />
    </section>
  );
}
