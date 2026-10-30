// @vitest-environment jsdom

import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MockedProvider, type MockedResponse } from "@apollo/client/testing";
import { ToastProvider } from "@/components/Toast";
import ProfilePage from "@/app/(app)/profile/page";
import {
  MyAccountSecurityDocument,
  MyAuditTrailDocument,
  MyProfileMetricsDocument,
  ProfileDocument,
  ProfileHistoryDocument,
} from "@/generated/graphql";

const h = vi.hoisted(() => ({ role: { current: "TALENT" as string | null } }));

vi.mock("@/lib/auth/guard", () => ({ useSessionRole: () => h.role.current }));

const contract = {
  __typename: "EmploymentContract",
  id: "ctr-1",
  contractNo: "TKWT/2025/0001",
  contractType: "TKWT_DIGITAL_TALENT",
  officeEmail: "ilham@telkom.co.id",
  nomorInduk: "EMP-001",
  bandPosition: "III",
  jobTitle: "Backend Engineer",
  jobLevel: null,
  workLocation: "JAKARTA",
  startDate: "2025-01-01",
  endDate: "2026-12-31",
  status: "ACTIVE",
  endReason: null,
  terminatedAt: null,
  notes: null,
  unit: { __typename: "Unit", id: "unit-1", name: "Chapter DPS" },
  jobRole: { __typename: "JobRole", id: "jr-1", name: "Backend Engineer" },
};

const endedContract = {
  ...contract,
  id: "ctr-0",
  contractNo: "TKWT/2023/0002",
  status: "ENDED",
  startDate: "2023-01-01",
  endDate: "2024-12-31",
};

const employee = {
  __typename: "Employee",
  id: "emp-001",
  fullName: "Ilham Fadillah",
  nikMasked: "****5678",
  email: "ilham@telkom.co.id",
  birthDate: "1998-04-12",
  gender: "MALE",
  phone: "081234567890",
  address: "Bandung",
  latestEducation: "S1",
  institutionName: "ITB",
  major: "Teknik Informatika",
  nomorInduk: "EMP-001",
  status: "ACTIVE",
  assignable: true,
  joinedAt: "2025-01-01",
  unit: { __typename: "Unit", id: "unit-1", name: "Chapter DPS" },
  jobRole: { __typename: "JobRole", id: "jr-1", name: "Backend Engineer" },
  chapter: { __typename: "Chapter", id: "ch-1", name: "Chapter DPS" },
};

const profileResult = {
  data: {
    me: {
      __typename: "User",
      id: "usr-1",
      email: "ilham@telkom.co.id",
      fullName: "Ilham Fadillah",
      accessRole: "TALENT",
      employee,
    },
  },
};

const historyResult = {
  data: {
    me: {
      __typename: "User",
      id: "usr-1",
      employee: {
        __typename: "Employee",
        id: "emp-001",
        contracts: {
          __typename: "EmploymentContractConnection",
          totalCount: 2,
          edges: [
            { __typename: "EmploymentContractEdge", node: contract, cursor: "c1" },
            { __typename: "EmploymentContractEdge", node: endedContract, cursor: "c0" },
          ],
        },
        assignments: { __typename: "AssignmentConnection", totalCount: 0, edges: [] },
      },
    },
  },
};

function metricsResult(overrides: Record<string, number | null> = {}) {
  return {
    data: {
      myProfileMetrics: {
        __typename: "ProfileMetrics",
        activeAssignmentCount: 1,
        utilizationPercent: 76,
        certificationCount: 2,
        runningIdpCount: 1,
        completedIdpCount: 1,
        ...overrides,
      },
    },
  };
}

const securityResult = {
  data: {
    myAccountSecurity: {
      __typename: "AccountSecurity",
      entraProvision: {
        __typename: "EntraProvision",
        status: "CREATED",
        action: "CREATE",
        upn: "ilham@telkom.co.id",
        lastError: null,
        notifyStatus: "SENT",
        needsReprovision: false,
        updatedAt: "2025-01-02T00:00:00Z",
      },
      sessions: [
        {
          __typename: "AccountSession",
          id: "ses-1",
          createdAt: "2025-02-01T08:00:00Z",
          expiresAt: "2025-03-01T08:00:00Z",
          authMethod: "entra_sso",
        },
      ],
    },
  },
};

const auditResult = {
  data: {
    myAuditTrail: [
      {
        __typename: "AuditLog",
        id: "aud-1",
        occurredAt: "2025-02-02T00:00:00Z",
        action: "UPDATE",
        entityType: "employment_contract",
        entityId: "ctr-1",
        actor: { __typename: "User", id: "usr-2", fullName: "Operation Tania" },
      },
    ],
  },
};

function baseMocks(metrics = metricsResult(), audit = auditResult): MockedResponse[] {
  return [
    { request: { query: ProfileDocument }, result: profileResult },
    { request: { query: MyProfileMetricsDocument }, result: metrics },
    { request: { query: MyAccountSecurityDocument }, result: securityResult },
    {
      request: { query: MyAuditTrailDocument, variables: { first: 5 } },
      result: audit,
    },
  ];
}

function renderProfile(mocks: MockedResponse[] = baseMocks()) {
  return render(
    <MockedProvider mocks={mocks}>
      <ToastProvider>
        <ProfilePage />
      </ToastProvider>
    </MockedProvider>,
  );
}

beforeEach(() => {
  h.role.current = "TALENT";
});

describe("ProfilePage (TAN-386, TAN-392)", () => {
  it("renders the identity hero, data diri, and metric strip", async () => {
    renderProfile();

    expect(await screen.findByRole("heading", { name: "Ilham Fadillah" })).toBeInTheDocument();
    expect(screen.getAllByText("Backend Engineer").length).toBeGreaterThan(0);
    expect(screen.getByText("Data diri")).toBeInTheDocument();
    expect(screen.getByText("Kontak")).toBeInTheDocument();
    expect(screen.getByText("Kepegawaian")).toBeInTheDocument();
    expect(screen.getByText("Pendidikan")).toBeInTheDocument();
    expect(screen.getByLabelText("Metrik profil")).toBeInTheDocument();
  });

  it("links each metric to the page it counts", async () => {
    renderProfile();
    await screen.findByRole("heading", { name: "Ilham Fadillah" });

    expect(screen.getByRole("link", { name: /Buka Workload saya/ })).toHaveAttribute(
      "href",
      "/workload",
    );
    expect(screen.getByRole("link", { name: /Buka CV saya/ })).toHaveAttribute("href", "/cv");
    expect(screen.getByRole("link", { name: /Buka IDP saya/ })).toHaveAttribute("href", "/idp/my");
    expect(screen.getByText("76%")).toBeInTheDocument();
  });

  it("shows an honest contract state when the role cannot read contracts", async () => {
    renderProfile();
    await screen.findByRole("heading", { name: "Ilham Fadillah" });

    expect(screen.getByText("Kontrak aktif")).toBeInTheDocument();
    expect(
      screen.getByText("Rincian kontrak belum dapat dibaca dari akun Anda"),
    ).toBeInTheDocument();
  });

  it("shows the active contract and a collapsible history for a reader", async () => {
    h.role.current = "OPERATION";
    renderProfile([
      ...baseMocks(),
      { request: { query: ProfileHistoryDocument }, result: historyResult },
    ]);
    await screen.findByRole("heading", { name: "Ilham Fadillah" });

    expect(await screen.findByText(/TKWT\/2025\/0001/)).toBeInTheDocument();
    expect(screen.getByText("Riwayat kontrak (1)")).toBeInTheDocument();
    expect(screen.getByText(/TKWT\/2023\/0002/)).toBeInTheDocument();
    expect(screen.getAllByText("Hanya baca").length).toBeGreaterThan(0);
  });

  it("renders account security and the self audit trail", async () => {
    renderProfile();
    await screen.findByRole("heading", { name: "Ilham Fadillah" });

    expect(screen.getByText("Akun & keamanan")).toBeInTheDocument();
    expect(screen.getByText(/1 perangkat aktif/)).toBeInTheDocument();
    expect(screen.getAllByText("ilham@telkom.co.id").length).toBeGreaterThan(0);
    expect(await screen.findByText(/Operation Tania/)).toBeInTheDocument();
  });

  it("renders a dash with a reason when a metric has no source", async () => {
    renderProfile(
      baseMocks(
        metricsResult({
          activeAssignmentCount: null,
          utilizationPercent: null,
          certificationCount: null,
          runningIdpCount: null,
        }),
      ),
    );
    await screen.findByRole("heading", { name: "Ilham Fadillah" });

    expect(screen.getByLabelText("Assignment aktif tidak tersedia")).toBeInTheDocument();
    expect(screen.getByText("Belum ada assignment aktif untuk akun ini.")).toBeInTheDocument();
    expect(screen.getByLabelText("Utilisasi 6 bulan tidak tersedia")).toBeInTheDocument();
    expect(screen.getByText("Profil CV belum pernah diisi.")).toBeInTheDocument();
    expect(screen.getByText("Chapter belum membuat IDP untuk Anda.")).toBeInTheDocument();
  });

  it("shows an empty state when the self audit trail is empty", async () => {
    renderProfile(baseMocks(metricsResult(), { data: { myAuditTrail: [] } }));
    await screen.findByRole("heading", { name: "Ilham Fadillah" });

    expect(
      await screen.findByText("Belum ada perubahan tercatat untuk record Anda."),
    ).toBeInTheDocument();
  });

  it("shows a danger alert with retry when the profile query fails", async () => {
    renderProfile([
      { request: { query: ProfileDocument }, error: new Error("Jaringan gagal.") },
      ...baseMocks(),
    ]);

    expect((await screen.findAllByRole("alert")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Jaringan gagal.").length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole("button", { name: "Coba lagi" })[0]);

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Ilham Fadillah" })).toBeInTheDocument(),
    );
  });
});
