// @vitest-environment jsdom

import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import ProfilePage from "@/app/(app)/profile/page";
import { MyIdpDocument, ProfileDocument } from "@/generated/graphql";

const h = vi.hoisted(() => ({
  role: { current: "TALENT" as string | null },
}));

vi.mock("@/lib/auth/guard", () => ({
  useSessionRole: () => h.role.current,
}));

const contracts = [
  {
    __typename: "EmploymentContract",
    id: "ctr-1",
    contractNo: "TKWT/2025/0001",
    contractType: "TKWT_DIGITAL_TALENT",
    officeEmail: null,
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
  },
];

const assignments = [
  {
    __typename: "Assignment",
    id: "asg-1",
    status: "ACTIVE",
    periodStart: "2025-02-01",
    periodEnd: null,
    project: { __typename: "Project", id: "prj-1", name: "Migrasi Billing Core" },
    jobRole: { __typename: "JobRole", id: "jr-1", name: "Backend Engineer" },
  },
];

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
  contracts: {
    __typename: "EmploymentContractConnection",
    totalCount: 1,
    edges: [{ __typename: "EmploymentContractEdge", node: contracts[0], cursor: "c1" }],
  },
  assignments: {
    __typename: "AssignmentConnection",
    totalCount: 1,
    edges: [{ __typename: "AssignmentEdge", node: assignments[0], cursor: "a1" }],
  },
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

const myIdpResult = {
  data: {
    myIdp: {
      __typename: "Idp",
      id: "idp-1",
      status: "IN_PROGRESS",
      developmentObjective: "Menjadi Go backend engineer yang andal",
      currentAssessment: "Kuat di API, kurang di concurrency",
      gapAnalysis: "Butuh pemahaman goroutine",
      timelineStart: "2025-07-01",
      timelineEnd: "2025-09-30",
      successIndicators: "Menyelesaikan 3 fitur backend mandiri",
      actions: [
        {
          __typename: "DevelopmentAction",
          id: "act-1",
          description: "Training Go lanjutan",
          method: "TRAINING",
          status: "IN_PROGRESS",
          dueDate: "2025-08-01",
        },
      ],
      reviews: [],
      revisions: [],
    },
  },
};

const profileMocks = [
  { request: { query: ProfileDocument }, result: profileResult },
  { request: { query: MyIdpDocument }, result: myIdpResult },
];

function renderProfile(mocks = profileMocks) {
  return render(
    <MockedProvider mocks={mocks}>
      <ProfilePage />
    </MockedProvider>
  );
}

beforeEach(() => {
  h.role.current = "TALENT";
});

describe("ProfilePage (TAN-188)", () => {
  it("renders the header and personal information by default", async () => {
    renderProfile();

    expect(await screen.findByRole("heading", { name: "Ilham Fadillah" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Informasi pribadi" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByText("****5678")).toBeInTheDocument();
    expect(screen.getByText("Laki-laki")).toBeInTheDocument();
    expect(screen.getAllByText("Chapter DPS").length).toBeGreaterThan(0);
  });

  it("shows the contract history on the Kontrak tab", async () => {
    renderProfile();
    await screen.findByRole("heading", { name: "Ilham Fadillah" });

    fireEvent.click(screen.getByRole("tab", { name: "Kontrak" }));

    expect(await screen.findByText("Riwayat kontrak (1)")).toBeInTheDocument();
    expect(screen.getByText("TKWT/2025/0001")).toBeInTheDocument();
    expect(screen.getByText("2025-01-01 — 2026-12-31")).toBeInTheDocument();
  });

  it("shows own assignments on the Assignment tab", async () => {
    renderProfile();
    await screen.findByRole("heading", { name: "Ilham Fadillah" });

    fireEvent.click(screen.getByRole("tab", { name: "Assignment" }));

    expect(await screen.findByText("Migrasi Billing Core")).toBeInTheDocument();
    expect(screen.getByText("2025-02-01 — sekarang")).toBeInTheDocument();
  });

  it("shows the own workload view on the Workload tab", async () => {
    renderProfile();
    await screen.findByRole("heading", { name: "Ilham Fadillah" });

    fireEvent.click(screen.getByRole("tab", { name: "Workload" }));

    expect(await screen.findByText("Beban kerja periode ini")).toBeInTheDocument();
  });

  it("shows the personal IDP plan on the IDP tab", async () => {
    renderProfile();
    await screen.findByRole("heading", { name: "Ilham Fadillah" });

    fireEvent.click(screen.getByRole("tab", { name: "IDP Saya" }));

    expect(
      await screen.findByText("Menjadi Go backend engineer yang andal")
    ).toBeInTheDocument();
    expect(screen.getByText("Training Go lanjutan")).toBeInTheDocument();
    expect(screen.getByText("0/1 aksi selesai")).toBeInTheDocument();
  });

  it("hides the IDP tab for roles without IDP access", async () => {
    h.role.current = "OPERATION";
    renderProfile();
    await screen.findByRole("heading", { name: "Ilham Fadillah" });

    expect(screen.queryByRole("tab", { name: "IDP Saya" })).toBeNull();
    expect(screen.getByRole("tab", { name: "Informasi pribadi" })).toBeInTheDocument();
  });
});
