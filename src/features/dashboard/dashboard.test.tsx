// @vitest-environment jsdom

import * as React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import DashboardPage from "@/app/(app)/dashboard/page";
import { DashboardDocument } from "@/generated/graphql";

const chapter = { __typename: "Chapter", id: "ch-1", name: "Backend" };
const unit = { __typename: "Unit", id: "u-1", name: "Platform" };

function renderDashboard(member: Record<string, unknown>) {
  render(
    <MockedProvider mocks={[{ request: { query: DashboardDocument }, result: { data: { dashboard: member } } }]}>
      <DashboardPage />
    </MockedProvider>
  );
}

describe("DashboardPage — union per role (FR-30 / US4)", () => {
  it("renders Admin widgets on AdminDashboard", async () => {
    renderDashboard({
      __typename: "AdminDashboard",
      talentsPerChapter: [
        { __typename: "ChapterCount", chapter, count: 3 },
        { __typename: "ChapterCount", chapter: { __typename: "Chapter", id: "ch-2", name: "Frontend" }, count: 2 },
      ],
      accountsPerRole: [
        { __typename: "RoleCount", role: "ADMIN", count: 1 },
        { __typename: "RoleCount", role: "TALENT", count: 5 },
      ],
      inactiveAccounts: 2,
      masterDataActiveCounts: [
        { __typename: "MasterDataCount", kind: "unit", active: 4, inactive: 1 },
      ],
    });

    expect(await screen.findByText("Talent per Chapter")).toBeInTheDocument();
    expect(screen.getByText("Backend")).toBeInTheDocument();
    expect(screen.getByText("Akun per Peran")).toBeInTheDocument();
    expect(screen.getByText("Data Master Aktif")).toBeInTheDocument();
  });
  it("renders Operation widgets on OperationDashboard", async () => {
    renderDashboard({
      __typename: "OperationDashboard",
      totalActiveEmployees: 10,
      employeesPerUnit: [{ __typename: "UnitCount", unit, count: 7 }],
      nonAssignableEmployees: 2,
      recentEmployeeChanges: [
        { __typename: "Employee", id: "emp-1", fullName: "Andi Pratama", nomorInduk: "EMP-001" },
      ],
    });

    expect(await screen.findByText("Karyawan per Unit")).toBeInTheDocument();
    expect(screen.getByText("Platform")).toBeInTheDocument();
    expect(screen.getByText("Perubahan Karyawan Terbaru")).toBeInTheDocument();
    expect(screen.getByText("Andi Pratama")).toBeInTheDocument();
  });

  it("renders Chapter widgets on ChapterDashboard", async () => {
    renderDashboard({
      __typename: "ChapterDashboard",
      idpStatusDistribution: [
        { __typename: "IdpStatusCount", status: "IN_PROGRESS", count: 2 },
      ],
      actionProgress: [
        { __typename: "ActionStatusCount", status: "COMPLETED", count: 4 },
      ],
      unassignedTalents: [
        { __typename: "Employee", id: "emp-2", fullName: "Sari Dewi", nomorInduk: "EMP-002" },
      ],
      idpsNeedingReview: 1,
      currentEvaluationPeriod: {
        __typename: "EvaluationPeriod",
        id: "ep-1",
        name: "Q3 2025",
        startDate: "2025-07-01",
        endDate: "2025-09-30",
        state: "RUNNING",
      },
    });

    expect(await screen.findByText("Distribusi Status IDP")).toBeInTheDocument();
    expect(screen.getByText("Progres Aksi")).toBeInTheDocument();
    expect(screen.getByText("Talent Tanpa Penugasan")).toBeInTheDocument();
    expect(screen.getByText("Sari Dewi")).toBeInTheDocument();
  });

  it("renders Talent widgets on TalentDashboard", async () => {
    renderDashboard({
      __typename: "TalentDashboard",
      activeAssignments: [
        {
          __typename: "Assignment",
          id: "as-1",
          periodStart: "2025-07-01",
          periodEnd: null,
          status: "ACTIVE",
          project: { __typename: "Project", id: "p-1", name: "Riset API" },
          jobRole: { __typename: "JobRole", id: "j-1", name: "Backend Engineer" },
        },
      ],
      idpProgress: [
        { __typename: "ActionStatusCount", status: "IN_PROGRESS", count: 1 },
      ],
      latestEvaluation: {
        __typename: "PerformanceEvaluation",
        id: "ev-1",
        status: "SUBMITTED",
        period: { name: "Q3 2025" },
      },
      upcomingActionDeadlines: [
        { __typename: "DevelopmentAction", id: "da-1", description: "Ikut training GraphQL", method: "TRAINING", status: "TODO", dueDate: "2025-08-01" },
      ],
    });

    expect(await screen.findByText("Penugasan Aktif")).toBeInTheDocument();
    expect(screen.getByText("Riset API")).toBeInTheDocument();
    expect(screen.getByText("Progres Aksi IDP")).toBeInTheDocument();
    expect(screen.getByText("Ikut training GraphQL")).toBeInTheDocument();
  });
});