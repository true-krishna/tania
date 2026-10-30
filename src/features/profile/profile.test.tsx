// @vitest-environment jsdom

import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MockedProvider, type MockedResponse } from "@apollo/client/testing";
import { ToastProvider } from "@/components/Toast";
import ProfilePage from "@/app/(app)/profile/page";
import {
  MyCvProfileDocument,
  MyIdpDocument,
  ProfileDocument,
  ProfileHistoryDocument,
} from "@/generated/graphql";

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
  },
  {
    __typename: "Assignment",
    id: "asg-2",
    status: "COMPLETED",
    periodStart: "2024-01-01",
    periodEnd: "2024-12-31",
    project: { __typename: "Project", id: "prj-2", name: "Modernisasi Portal" },
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
    totalCount: 2,
    edges: [
      { __typename: "AssignmentEdge", node: assignments[0], cursor: "a1" },
      { __typename: "AssignmentEdge", node: assignments[1], cursor: "a2" },
    ],
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

const cvResult = {
  data: {
    myCvProfile: {
      __typename: "CvProfile",
      id: "cv-1",
      summary: "Backend engineer yang fokus pada API.",
      educations: [
        {
          __typename: "CvEducation",
          id: "edu-1",
          institution: "Institut Teknologi Bandung",
          degree: "S1",
          fieldOfStudy: "Teknik Informatika",
          startYear: 2016,
          endYear: 2020,
        },
      ],
      certifications: [
        {
          __typename: "CvCertification",
          id: "cert-1",
          name: "AWS Certified Developer",
          issuer: "AWS",
          issuedDate: "2024-01-15",
          expiryDate: null,
          credentialUrl: null,
        },
      ],
      skills: [
        { __typename: "CvSkill", id: "skill-1", name: "Go", level: "Mahir" },
        { __typename: "CvSkill", id: "skill-2", name: "PostgreSQL", level: "Mahir" },
        { __typename: "CvSkill", id: "skill-3", name: "Docker", level: "Menengah" },
        { __typename: "CvSkill", id: "skill-4", name: "Figma", level: null },
      ],
      workExperience: [assignments[0]],
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

const historyResult = {
  data: {
    me: {
      __typename: "User",
      id: "usr-1",
      employee: {
        __typename: "Employee",
        id: "emp-001",
        contracts: employee.contracts,
        assignments: employee.assignments,
      },
    },
  },
};

const baseMocks: MockedResponse[] = [
  { request: { query: ProfileDocument }, result: profileResult },
  { request: { query: MyCvProfileDocument }, result: cvResult },
  { request: { query: MyCvProfileDocument }, result: cvResult },
  { request: { query: MyIdpDocument }, result: myIdpResult },
];

const historyMock: MockedResponse = {
  request: { query: ProfileHistoryDocument },
  result: historyResult,
};
const profileWithHistoryMocks: MockedResponse[] = [...baseMocks, historyMock];

function renderProfile(mocks: MockedResponse[] = baseMocks) {
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

describe("ProfilePage (TAN-386)", () => {
  it("renders the identity hero, metrics, and ringkasan data", async () => {
    renderProfile();

    expect(await screen.findByRole("heading", { name: "Ilham Fadillah" })).toBeInTheDocument();
    expect(screen.getAllByText("Backend Engineer").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Aktif").length).toBeGreaterThan(0);
    expect(screen.getAllByText("****5678").length).toBeGreaterThan(0);
    expect(screen.getByText("Laki-laki")).toBeInTheDocument();
    expect(screen.getAllByText("Chapter DPS").length).toBeGreaterThan(0);
    expect(screen.getByRole("tab", { name: "Ringkasan" })).toHaveAttribute("aria-selected", "true");
  });

  it("switches tab and panel visibility with aria state", async () => {
    renderProfile();
    await screen.findByRole("heading", { name: "Ilham Fadillah" });

    const ringkasanPanel = document.getElementById("profile-panel-ringkasan");
    expect(ringkasanPanel).not.toBeNull();
    expect(ringkasanPanel).toHaveAttribute("aria-labelledby", "profile-tab-ringkasan");
    expect(ringkasanPanel?.hidden).toBe(false);

    fireEvent.click(screen.getByRole("tab", { name: "Keahlian & CV" }));

    expect(screen.getByRole("tab", { name: "Keahlian & CV" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Ringkasan" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
    expect(document.getElementById("profile-panel-keahlian")?.hidden).toBe(false);
    expect(ringkasanPanel?.hidden).toBe(true);
  });

  it("moves the tab selection with arrow keys", async () => {
    renderProfile();
    await screen.findByRole("heading", { name: "Ilham Fadillah" });

    const ringkasanTab = screen.getByRole("tab", { name: "Ringkasan" });
    ringkasanTab.focus();
    fireEvent.keyDown(ringkasanTab, { key: "ArrowRight" });

    expect(screen.getByRole("tab", { name: "Keahlian & CV" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    fireEvent.keyDown(screen.getByRole("tab", { name: "Keahlian & CV" }), { key: "ArrowLeft" });

    expect(ringkasanTab).toHaveAttribute("aria-selected", "true");
  });

  it("hides contract and assignment tabs from Talent", async () => {
    renderProfile();
    await screen.findByRole("heading", { name: "Ilham Fadillah" });

    expect(screen.getByRole("tab", { name: "Ringkasan" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Keahlian & CV" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Workload" })).toBeNull();
    expect(screen.getByRole("tab", { name: "Pengembangan saya" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Kontrak" })).toBeNull();
    expect(screen.queryByRole("tab", { name: "Assignment" })).toBeNull();
  });

  it("shows contract history with a read-only marker for Operation", async () => {
    h.role.current = "OPERATION";
    renderProfile(profileWithHistoryMocks);
    await screen.findByRole("heading", { name: "Ilham Fadillah" });

    fireEvent.click(screen.getByRole("tab", { name: "Kontrak" }));

    expect(await screen.findByText("Riwayat kontrak (1)")).toBeInTheDocument();
    expect(screen.getByText("TKWT/2025/0001")).toBeInTheDocument();
    expect(screen.getByText("2025-01-01 — 2026-12-31")).toBeInTheDocument();
    expect(screen.getAllByText("Hanya baca").length).toBeGreaterThan(0);
  });

  it("shows own assignments on the Assignment tab for Operation", async () => {
    h.role.current = "OPERATION";
    renderProfile(profileWithHistoryMocks);
    await screen.findByRole("heading", { name: "Ilham Fadillah" });

    fireEvent.click(screen.getByRole("tab", { name: "Assignment" }));

    const panel = document.getElementById("profile-panel-assignment");
    expect(panel).not.toBeNull();
    expect(
      await within(panel as HTMLElement).findByText("Migrasi Billing Core"),
    ).toBeInTheDocument();
    expect(within(panel as HTMLElement).getByText("2025-02-01 — sekarang")).toBeInTheDocument();
    expect(within(panel as HTMLElement).getByText("Berjalan")).toBeInTheDocument();
  });

  it("relabels the IDP tab and renders the development plan", async () => {
    renderProfile();
    await screen.findByRole("heading", { name: "Ilham Fadillah" });

    fireEvent.click(screen.getByRole("tab", { name: "Pengembangan saya" }));

    expect(await screen.findByText("Menjadi Go backend engineer yang andal")).toBeInTheDocument();
    expect(screen.getByText("Training Go lanjutan")).toBeInTheDocument();
    expect(screen.getByText("0/1 aksi selesai")).toBeInTheDocument();
  });

  it("composes the CV read-only content in Keahlian & CV", async () => {
    renderProfile();
    await screen.findByRole("heading", { name: "Ilham Fadillah" });
    fireEvent.click(screen.getByRole("tab", { name: "Keahlian & CV" }));

    const panel = document.getElementById("profile-panel-keahlian") as HTMLElement;
    expect(await within(panel).findByText("AWS Certified Developer")).toBeInTheDocument();
    expect(within(panel).getByText(/Institut Teknologi Bandung/)).toBeInTheDocument();
    expect(within(panel).getByText("Go")).toBeInTheDocument();
    expect(within(panel).getByText("Docker")).toBeInTheDocument();
    expect(within(panel).getByText("Level keahlian belum diisi.")).toBeInTheDocument();
    expect(within(panel).getByLabelText("Mahir: level 75 dari 100")).toBeInTheDocument();
    expect(within(panel).getByText("Migrasi Billing Core")).toBeInTheDocument();
  });

  it("lets Talent edit their own CV from the Keahlian & CV tab (TAN-372)", async () => {
    renderProfile();
    await screen.findByRole("heading", { name: "Ilham Fadillah" });
    fireEvent.click(screen.getByRole("tab", { name: "Keahlian & CV" }));

    fireEvent.click(await screen.findByRole("button", { name: "Ubah profil CV" }));

    expect(await screen.findByText("Ringkasan Profil")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+ Tambah Pendidikan" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Selesai mengubah" }));

    expect(screen.queryByRole("button", { name: "+ Tambah Pendidikan" })).toBeNull();
  });

  it("runs the Ask TANIA insight through loading, result, and close states", async () => {
    renderProfile();
    await screen.findByRole("heading", { name: "Ilham Fadillah" });
    fireEvent.click(screen.getByRole("tab", { name: "Keahlian & CV" }));

    const startButton = await screen.findByRole("button", { name: "Buat insight" });
    fireEvent.click(startButton);

    expect(screen.getByRole("button", { name: "Menyusun…" })).toBeDisabled();

    expect(
      await screen.findByText(/Profil Anda memuat/, {}, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(screen.getByText(/4 keahlian, 1 sertifikasi/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tutup insight" }));

    expect(screen.getByRole("button", { name: "Buat insight" })).toBeInTheDocument();
    expect(screen.queryByText(/Profil Anda memuat/)).toBeNull();
  });

  it("renders unavailable metrics with their reason instead of a number", async () => {
    renderProfile();
    await screen.findByRole("heading", { name: "Ilham Fadillah" });

    expect(screen.getByLabelText("Assignment aktif tidak tersedia")).toBeInTheDocument();
    expect(screen.getByText("Butuh akses modul Assignment.")).toBeInTheDocument();
    expect(screen.getByLabelText("Utilisasi 6 bulan tidak tersedia")).toBeInTheDocument();
    expect(
      screen.getByText("Belum ada sumber data utilisasi (menunggu agregat WAD)."),
    ).toBeInTheDocument();
    expect(screen.getByText("Terdata di profil CV.")).toBeInTheDocument();
    expect(screen.getByText("0/1 aksi selesai.")).toBeInTheDocument();
  });

  it("counts active assignments for a role with assignment access", async () => {
    h.role.current = "OPERATION";
    renderProfile(profileWithHistoryMocks);
    await screen.findByRole("heading", { name: "Ilham Fadillah" });

    expect(screen.getByText("2 assignment tercatat.")).toBeInTheDocument();
  });

  it("shows a danger alert with retry when the profile query fails", async () => {
    const retryMocks: MockedResponse[] = [
      { request: { query: ProfileDocument }, error: new Error("Jaringan gagal.") },
      ...baseMocks,
      { request: { query: ProfileDocument }, result: profileResult },
    ];
    renderProfile(retryMocks);

    expect((await screen.findAllByRole("alert")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Jaringan gagal.").length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole("button", { name: "Coba lagi" })[0]);

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Ilham Fadillah" })).toBeInTheDocument(),
    );
  });
});
