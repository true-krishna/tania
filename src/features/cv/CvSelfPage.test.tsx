// @vitest-environment jsdom

import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { ToastProvider } from "@/components/Toast";
import { MyCvProfileDocument } from "@/generated/graphql";
import { CvSelfPage } from "./CvSelfPage";

vi.mock("@/lib/auth/guard", () => ({ useSessionRole: () => "TALENT" }));

const cv = {
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
      expiryDate: "2024-12-31",
      credentialUrl: null,
    },
  ],
  skills: [{ __typename: "CvSkill", id: "skill-1", name: "Go", level: "Mahir" }],
  workExperience: [
    {
      __typename: "Assignment",
      id: "asg-1",
      periodStart: "2024-01-01",
      periodEnd: null,
      status: "ACTIVE",
      project: { __typename: "Project", id: "prj-1", name: "Migrasi Billing Core" },
    },
  ],
};

function renderPage() {
  return render(
    <ToastProvider>
      <MockedProvider
        mocks={[{ request: { query: MyCvProfileDocument }, result: { data: { myCvProfile: cv } } }]}
      >
        <CvSelfPage />
      </MockedProvider>
    </ToastProvider>,
  );
}

describe("CvSelfPage (TAN-392)", () => {
  it("renders the CV sections with certification expiry", async () => {
    renderPage();
    expect(await screen.findByText("Backend engineer yang fokus pada API.")).toBeInTheDocument();
    expect(screen.getByText("AWS Certified Developer")).toBeInTheDocument();
    expect(screen.getByText("Berlaku s.d. 31 Des 2024")).toBeInTheDocument();
    expect(screen.getByText("Kedaluwarsa")).toBeInTheDocument();
    expect(screen.getByText("Migrasi Billing Core")).toBeInTheDocument();
  });

  it("hides edit affordances in document preview mode", async () => {
    renderPage();
    await screen.findByText("AWS Certified Developer");

    fireEvent.click(screen.getByRole("button", { name: "Pratinjau dokumen" }));

    expect(screen.getByRole("article", { name: "Pratinjau dokumen CV" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ubah CV" })).toBeNull();
    expect(screen.queryByPlaceholderText("Nama sertifikasi (wajib)")).toBeNull();
  });

  it("opens the existing CV mutations in edit mode", async () => {
    renderPage();
    await screen.findByText("AWS Certified Developer");

    fireEvent.click(screen.getByRole("button", { name: "Ubah CV" }));
    expect(screen.getByPlaceholderText("Nama sertifikasi (wajib)")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Selesai" }));
    expect(screen.queryByPlaceholderText("Nama sertifikasi (wajib)")).toBeNull();
  });
});
