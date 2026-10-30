// @vitest-environment jsdom

import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { MyCvProfileDocument } from "@/generated/graphql";
import { MyAssignmentsPage } from "./MyAssignmentsPage";

const h = vi.hoisted(() => ({ role: { current: "TALENT" as string | null } }));

vi.mock("@/lib/auth/guard", () => ({ useSessionRole: () => h.role.current }));

const cv = {
  __typename: "CvProfile",
  id: "cv-1",
  summary: null,
  educations: [],
  certifications: [],
  skills: [],
  workExperience: [
    {
      __typename: "Assignment",
      id: "asg-1",
      periodStart: "2026-02-01",
      periodEnd: null,
      status: "ACTIVE",
      project: { __typename: "Project", id: "prj-1", name: "AI Productization Program" },
    },
    {
      __typename: "Assignment",
      id: "asg-2",
      periodStart: "2025-09-01",
      periodEnd: "2025-12-31",
      status: "COMPLETED",
      project: { __typename: "Project", id: "prj-2", name: "Telkom Cloud Upskilling" },
    },
  ],
};

function renderPage(workExperience = cv.workExperience) {
  return render(
    <MockedProvider
      mocks={[
        {
          request: { query: MyCvProfileDocument },
          result: { data: { myCvProfile: { ...cv, workExperience } } },
        },
      ]}
    >
      <MyAssignmentsPage />
    </MockedProvider>,
  );
}

describe("MyAssignmentsPage (TAN-392)", () => {
  it("renders active assignment cards and the history table", async () => {
    renderPage();

    expect(await screen.findByText("AI Productization Program")).toBeInTheDocument();
    expect(screen.getByText("Periode: sejak 1 Feb 2026")).toBeInTheDocument();
    const history = screen.getByRole("table", { name: "Riwayat assignment" });
    expect(within(history).getByText("Telkom Cloud Upskilling")).toBeInTheDocument();
    expect(within(history).getByText("1 Sep 2025 s.d. 31 Des 2025")).toBeInTheDocument();
    expect(screen.getByText("1 selesai")).toBeInTheDocument();
  });

  it("shows the honest empty state when there is no assignment", async () => {
    renderPage([]);
    expect(
      await screen.findByText(
        "Belum ada assignment untuk Anda. Assignment ditetapkan oleh Chapter atau Operation.",
      ),
    ).toBeInTheDocument();
  });

  it("denies non-Talent roles", () => {
    h.role.current = "OPERATION";
    renderPage();
    expect(screen.getByText("Anda tidak memiliki akses ke halaman ini")).toBeInTheDocument();
    h.role.current = "TALENT";
  });
});
