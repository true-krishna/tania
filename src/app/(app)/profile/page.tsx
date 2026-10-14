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
} from "@/features/profile";
import { useSessionRole } from "@/lib/auth/guard";
import { canAccess } from "@/lib/auth/matrix";

type ProfileTab = "personal" | "contracts" | "assignments" | "workload" | "idp";

const PROFILE_TABS: { id: ProfileTab; label: string; module?: "idp" }[] = [
  { id: "personal", label: "Informasi pribadi" },
  { id: "contracts", label: "Kontrak" },
  { id: "assignments", label: "Assignment" },
  { id: "workload", label: "Workload" },
  { id: "idp", label: "IDP Saya", module: "idp" },
];

/**
 * `/profile` (TAN-188): the signed-in user's information on one page — personal
 * data, contract history, assignments, workload and the personal IDP plan.
 * Read-only; capture and editing stay in their own modules.
 */
export default function ProfilePage() {
  const role = useSessionRole();
  const { status, data, error, session } = useProfile();
  const [tab, setTab] = React.useState<ProfileTab>("personal");

  const employee = data;
  const tabs = PROFILE_TABS.filter((item) => !item.module || canAccess(role, item.module));
  const selectedTab: ProfileTab = tabs.some((item) => item.id === tab) ? tab : "personal";

  return (
    <section className="flex flex-col gap-4">
      <PageHeader
        title={employee?.fullName ?? session?.fullName ?? "Profil saya"}
        subtitle={
          employee ? `${employee.nomorInduk ?? "Tanpa nomor induk"} · ${employee.email}` : undefined
        }
      />

      <div
        role="tablist"
        aria-label="Detail profil"
        className="flex gap-6 overflow-x-auto border-b border-board-border"
      >
        {tabs.map((item) => {
          const selected = item.id === selectedTab;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(item.id)}
              className={
                selected
                  ? "-mb-px border-b-2 border-tp-brand-navy px-1 py-2 text-sm font-semibold text-zinc-900"
                  : "-mb-px border-b-2 border-transparent px-1 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-900"
              }
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
        <ContractsSection contracts={employee.contracts.edges.map((edge) => edge.node)} />
      ) : selectedTab === "assignments" ? (
        <AssignmentsSection assignments={employee.assignments.edges.map((edge) => edge.node)} />
      ) : (
        <PersonalInfoSection employee={employee} />
      )}
    </section>
  );
}