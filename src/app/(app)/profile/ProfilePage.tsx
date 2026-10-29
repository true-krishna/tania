"use client";

import * as React from "react";
import { ErrorState, LoadingState } from "@/components/DataState";
import { PageHeader } from "@/components/PageHeader";
import {
  AssignmentsSection,
  ContractsSection,
  IdpSection,
  PersonalInfoSection,
  WorkloadSection,
  useProfile,
  useProfileHistory,
} from "@/features/profile";
import { useModuleAccess } from "@/lib/auth/access";
import type { Module } from "@/lib/auth/matrix";

type ProfileTab = "personal" | "contracts" | "assignments" | "workload" | "idp";

const PROFILE_TABS: { id: ProfileTab; label: string; module?: Module }[] = [
  { id: "personal", label: "Informasi pribadi" },
  { id: "contracts", label: "Kontrak", module: "contracts" },
  { id: "assignments", label: "Assignment", module: "assignments" },
  { id: "workload", label: "Workload" },
  { id: "idp", label: "IDP Saya", module: "idp" },
];

export default function ProfilePage() {
  const contractsAccess = useModuleAccess("contracts");
  const assignmentsAccess = useModuleAccess("assignments");
  const idpAccess = useModuleAccess("idp");
  const { status, data, error, session } = useProfile();
  const [tab, setTab] = React.useState<ProfileTab>("personal");

  const employee = data;
  const tabs = PROFILE_TABS.filter(
    (item) =>
      !item.module ||
      (item.module === "contracts" && contractsAccess.canRead) ||
      (item.module === "assignments" && assignmentsAccess.canRead) ||
      (item.module === "idp" && idpAccess.canRead),
  );
  const selectedTab: ProfileTab = tabs.some((item) => item.id === tab) ? tab : "personal";
  const history = useProfileHistory(
    tabs.some((item) => item.id === "contracts" || item.id === "assignments")
  );

  return (
    <section className="flex flex-col gap-4">
      <PageHeader
        subtitle={
          employee ? `${employee.nomorInduk ?? "Tanpa nomor induk"} · ${employee.email}` : undefined
        }
        title={employee?.fullName ?? session?.fullName ?? "Profil saya"}
      />

      <div
        aria-label="Detail profil"
        className="flex gap-6 overflow-x-auto border-b border-board-border"
        role="tablist"
      >
        {tabs.map((item) => {
          const selected = item.id === selectedTab;
          return (
            <button
              aria-selected={selected}
              className={
                selected
                  ? "-mb-px border-b-2 border-tp-brand-navy px-1 py-2 text-sm font-semibold text-zinc-900"
                  : "-mb-px border-b-2 border-transparent px-1 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-900"
              }
              key={item.id}
              onClick={() => setTab(item.id)}
              role="tab"
              type="button"
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {selectedTab === "workload" ? (
        <WorkloadSection />
      ) : selectedTab === "idp" ? (
        <IdpSection />
      ) : status === "loading" ? (
        <LoadingState />
      ) : status === "error" ? (
        <ErrorState message={error ?? "Gagal memuat profil."} />
      ) : !employee ? (
        <PersonalInfoSection employee={undefined} />
      ) : selectedTab === "contracts" ? (
        history.status === "loading" ? (
          <LoadingState />
        ) : history.status === "error" ? (
          <ErrorState message={history.error ?? "Gagal memuat riwayat kontrak."} />
        ) : (
          <ContractsSection contracts={history.data?.contracts ?? []} />
        )
      ) : selectedTab === "assignments" ? (
        history.status === "loading" ? (
          <LoadingState />
        ) : history.status === "error" ? (
          <ErrorState message={history.error ?? "Gagal memuat riwayat assignment."} />
        ) : (
          <AssignmentsSection assignments={history.data?.assignments ?? []} />
        )
      ) : (
        <PersonalInfoSection employee={employee} />
      )}
    </section>
  );
}