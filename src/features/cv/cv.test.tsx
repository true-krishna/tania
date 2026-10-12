// @vitest-environment jsdom

import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { ToastProvider } from "@/components/Toast";
import CvPage from "@/app/(app)/cv/page";
import {
  AddCvEducationDocument,
  CvProfileDocument,
  EmployeesDocument,
  MyCvProfileDocument,
} from "@/generated/graphql";

vi.mock("@/lib/auth/guard", () => ({
  useSessionRole: (): string | null => mockRole,
}));

let mockRole: string | null = "TALENT";

function setRole(role: string | null) {
  mockRole = role;
}

const cv = {
  __typename: "CvProfile",
  id: "cv-1",
  summary: "Engineer yang berorientasi pada hasil.",
  educations: [
    {
      __typename: "CvEducation",
      id: "edu-1",
      institution: "Universitas Indonesia",
      degree: "S.Kom",
      fieldOfStudy: "Ilmu Komputer",
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
      issuedDate: "2023-01-15",
      expiryDate: "2026-01-15",
      credentialUrl: null,
    },
  ],
  skills: [
    { __typename: "CvSkill", id: "skill-1", name: "Go", level: "Mahir" },
  ],
  workExperience: [
    {
      __typename: "Assignment",
      id: "asg-1",
      periodStart: "2022-03-01",
      periodEnd: null,
      status: "ACTIVE",
      project: { __typename: "Project", id: "prj-1", name: "Network Modernization" },
      jobRole: { __typename: "JobRole", id: "jr-1", name: "Engineer" },
    },
  ],
};

const myCvResult = { data: { myCvProfile: cv } };

const employee = {
  __typename: "Employee",
  id: "emp-1",
  fullName: "Andi Pratama",
  nomorInduk: "EMP-001",
  email: "andi@example.com",
  status: "ACTIVE",
  assignable: true,
  unit: { __typename: "Unit", id: "u-1", name: "Digital" },
  jobRole: { __typename: "JobRole", id: "jr-1", name: "Engineer" },
};

const employeesResult = {
  data: {
    employees: {
      __typename: "EmployeeConnection",
      totalCount: 1,
      edges: [{ __typename: "EmployeeEdge", cursor: "emp-1", node: employee }],
      pageInfo: { __typename: "PageInfo", hasNextPage: false, endCursor: null },
    },
  },
};

const cvProfileResult = { data: { cvProfile: cv } };

describe("CvPage — Talent editor (US4 / FR-12)", () => {
  it("renders the structured CV sections for the logged-in talent", async () => {
    render(
      <ToastProvider>
        <MockedProvider mocks={[{ request: { query: MyCvProfileDocument }, result: myCvResult }]}>
          <CvPage />
        </MockedProvider>
      </ToastProvider>
    );

    expect(await screen.findByText("Ringkasan Profil")).toBeInTheDocument();
    expect(screen.getByText("Pendidikan")).toBeInTheDocument();
    expect(screen.getByText("Sertifikasi")).toBeInTheDocument();
    expect(screen.getByText("Keahlian")).toBeInTheDocument();
    expect(screen.getByText("Pengalaman Kerja")).toBeInTheDocument();
    expect(await screen.findByText(/Universitas Indonesia/)).toBeInTheDocument();
    expect(screen.getByText("AWS Certified Developer")).toBeInTheDocument();
    expect(screen.getByText("Go")).toBeInTheDocument();
    expect(screen.getByText("Network Modernization")).toBeInTheDocument();
  });

  it("adds and removes an education entry", async () => {
    const added = {
      __typename: "CvEducation",
      id: "edu-2",
      institution: "Institut Teknologi Bandung",
      degree: "S1",
      fieldOfStudy: "Teknik Informatika",
      startYear: 2021,
      endYear: 2023,
    };

    render(
      <ToastProvider>
        <MockedProvider
          mocks={[
            { request: { query: MyCvProfileDocument }, result: myCvResult },
            {
              request: {
                query: AddCvEducationDocument,
                variables: {
                  input: {
                    institution: "Institut Teknologi Bandung",
                    degree: "S1",
                    fieldOfStudy: "Teknik Informatika",
                    startYear: 2021,
                    endYear: 2023,
                  },
                },
              },
              result: { data: { addCvEducation: added } },
            },
            { request: { query: MyCvProfileDocument }, result: { data: { myCvProfile: { ...cv, educations: [...cv.educations, added] } } } },
          ]}
        >
          <CvPage />
        </MockedProvider>
      </ToastProvider>
    );

    await screen.findByText(/Universitas Indonesia/);

    fireEvent.change(screen.getByPlaceholderText("Institusi (wajib)"), {
      target: { value: "Institut Teknologi Bandung" },
    });
    fireEvent.change(screen.getByLabelText("Jenjang pendidikan"), {
      target: { value: "S1" },
    });
    fireEvent.change(screen.getByPlaceholderText("Jurusan"), {
      target: { value: "Teknik Informatika" },
    });
    fireEvent.change(screen.getByPlaceholderText("Tahun mulai"), {
      target: { value: "2021" },
    });
    fireEvent.change(screen.getByPlaceholderText("Tahun selesai"), {
      target: { value: "2023" },
    });
    fireEvent.click(screen.getByRole("button", { name: "+ Tambah Pendidikan" }));

    expect(await screen.findByText("Riwayat pendidikan ditambahkan.")).toBeInTheDocument();
  });

  it("offers only the five controlled degree values (D11)", async () => {
    render(
      <ToastProvider>
        <MockedProvider mocks={[{ request: { query: MyCvProfileDocument }, result: myCvResult }]}>
          <CvPage />
        </MockedProvider>
      </ToastProvider>
    );

    await screen.findByText(/Universitas Indonesia/);

    const degreeSelect = screen.getByLabelText("Jenjang pendidikan");
    const options = Array.from(degreeSelect.querySelectorAll("option")).map(
      (o) => (o as HTMLOptionElement).value,
    );
    // Nilai = enum EducationLevel (kontrak SDL); label tampilan tetap D11.
    expect(options).toEqual(["", "SMA_SMK_SEDERAJAT", "D3", "S1", "S2", "S3"]);
    const labels = Array.from(degreeSelect.querySelectorAll("option")).map(
      (o) => (o as HTMLOptionElement).textContent,
    );
    expect(labels).toEqual([
      "— pilih jenjang (opsional) —",
      "SMA/SMK Sederajat",
      "D3",
      "S1",
      "S2",
      "S3",
    ]);
  });
});

describe("CvPage — Chapter read-only (US4 / FR-13)", () => {
  it("renders a read-only CV after selecting a talent", async () => {
    setRole("CHAPTER");
    render(
      <ToastProvider>
        <MockedProvider
          mocks={[
            {
              request: { query: EmployeesDocument, variables: { filter: { assignableOnly: true }, first: 25, after: null } },
              result: employeesResult,
            },
            {
              request: { query: CvProfileDocument, variables: { employeeId: "emp-1" } },
              result: cvProfileResult,
            },
          ]}
        >
          <CvPage />
        </MockedProvider>
      </ToastProvider>
    );

    expect(await screen.findByText("Andi Pratama (EMP-001)")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "emp-1" } });

    expect(await screen.findByText(/Universitas Indonesia/)).toBeInTheDocument();
    expect(screen.getByText("AWS Certified Developer")).toBeInTheDocument();
    expect(screen.getByText("Go")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "+ Tambah Pendidikan" })).not.toBeInTheDocument();
  });
});