// @vitest-environment jsdom

import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MockedProvider, type MockedResponse } from "@apollo/client/testing";
import DashboardPage from "@/app/(app)/dashboard/page";
import { DashboardDocument } from "@/generated/graphql";
import {
  TALENT_REPORT_QUERY,
  TALENT_REPORT_RANGE_QUERY,
} from "@/features/talent-report/useTalentReport";
import {
  MOCK_TALENT_REPORT,
  MOCK_TALENT_REPORT_RANGE,
} from "@/features/talent-report/mocks";

const echartsMock = vi.hoisted(() => {
  const instance = {
    setOption: vi.fn(),
    resize: vi.fn(),
    dispose: vi.fn(),
    getDataURL: vi.fn(() => "data:image/png;base64,AAAA"),
  };
  class ResizeObserverStub {
    static instances: ResizeObserverStub[] = [];
    callback: ResizeObserverCallback;
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
      ResizeObserverStub.instances.push(this);
    }
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  return {
    instance,
    use: vi.fn(),
    init: vi.fn<(element: HTMLElement) => typeof instance>(() => instance),
    ResizeObserverStub,
  };
});

vi.mock("echarts/core", () => ({ use: echartsMock.use, init: echartsMock.init }));
vi.mock("echarts/charts", () => ({ BarChart: {}, LineChart: {} }));
vi.mock("echarts/components", () => ({
  GridComponent: {},
  TitleComponent: {},
  TooltipComponent: {},
  LegendComponent: {},
}));
vi.mock("echarts/renderers", () => ({ CanvasRenderer: {} }));

vi.stubGlobal("ResizeObserver", echartsMock.ResizeObserverStub);

const chapter = { __typename: "Chapter", id: "ch-1", name: "Backend" };
const unit = { __typename: "Unit", id: "u-1", name: "Platform" };

// Amandemen penempatan (TAN-154, 2026-10-12): konten OperationDashboard &
// ChapterDashboard digantikan konten Laporan Talent — mock kuerinya perlu.
const fullPeriod = {
  startMonth: MOCK_TALENT_REPORT_RANGE.startMonth,
  endMonth: MOCK_TALENT_REPORT_RANGE.endMonth,
};

function talentReportData(report: typeof MOCK_TALENT_REPORT) {
  const categories = (items: readonly { label: string; count: number; kind: string }[]) =>
    items.map((c) => ({ __typename: "ReportCategoryCount", ...c }));
  return {
    talentReport: {
      __typename: "TalentReport",
      ...report,
      roleDistribution: categories(report.roleDistribution),
      generationDistribution: categories(report.generationDistribution),
      educationDistribution: categories(report.educationDistribution),
      workLocationDistribution: categories(report.workLocationDistribution),
      movementTrend: report.movementTrend.map((m) => ({
        __typename: "ReportMonthlyMovement",
        ...m,
      })),
    },
  };
}

function talentReportMocks(): MockedResponse[] {
  return [
    {
      request: { query: TALENT_REPORT_RANGE_QUERY },
      result: {
        data: {
          talentReportRange: { __typename: "TalentReportRange", ...MOCK_TALENT_REPORT_RANGE },
        },
      },
    },
    {
      request: { query: TALENT_REPORT_QUERY, variables: { period: fullPeriod } },
      result: { data: talentReportData(MOCK_TALENT_REPORT) },
    },
  ];
}

function renderDashboard(member: Record<string, unknown>, extraMocks: MockedResponse[] = []) {
  render(
    <MockedProvider mocks={[
      { request: { query: DashboardDocument }, result: { data: { dashboard: member } } },
      ...extraMocks,
    ]}>
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
  it("replaces Operation widgets with the talent report (placement amendment, TAN-154)", async () => {
    renderDashboard(
      {
        __typename: "OperationDashboard",
        totalActiveEmployees: 10,
        employeesPerUnit: [{ __typename: "UnitCount", unit, count: 7 }],
        nonAssignableEmployees: 2,
        recentEmployeeChanges: [
          { __typename: "Employee", id: "emp-1", fullName: "Andi Pratama", nomorInduk: "EMP-001" },
        ],
      },
      talentReportMocks(),
    );

    expect(await screen.findByText("Talent per role")).toBeInTheDocument();
    expect(screen.getByText("Tren churn vs new talent")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Terapkan" })).toBeInTheDocument();
    expect(screen.queryByText("Karyawan per Unit")).toBeNull();
    expect(screen.queryByText("Perubahan Karyawan Terbaru")).toBeNull();
  });

  it("replaces Chapter widgets with the talent report (placement amendment, TAN-154)", async () => {
    renderDashboard(
      {
        __typename: "ChapterDashboard",
        unassignedTalents: [
          { __typename: "Employee", id: "emp-2", fullName: "Sari Dewi", nomorInduk: "EMP-002" },
        ],
      },
      talentReportMocks(),
    );

    expect(await screen.findByText("Talent per jenjang pendidikan")).toBeInTheDocument();
    expect(screen.getByText("Talent per lokasi kerja")).toBeInTheDocument();
    expect(screen.queryByText("Distribusi Status IDP")).toBeNull();
    expect(screen.queryByText("Talent Tanpa Penugasan")).toBeNull();
  });

  it("renders Talent widgets without deferred IDP/Evaluation content (T035)", async () => {
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
    });

    expect(await screen.findByText("Penugasan Aktif")).toBeInTheDocument();
    expect(screen.getByText("Riset API")).toBeInTheDocument();
    expect(screen.queryByText("Progres Aksi IDP")).toBeNull();
    expect(screen.queryByText("Tenggat Aksi Terdekat")).toBeNull();
    expect(screen.queryByText("Evaluasi terakhir")).toBeNull();
    expect(screen.queryByRole("link", { name: /IDP saya/ })).toBeNull();
  });
});