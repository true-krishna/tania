// @vitest-environment jsdom

import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
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

function talentReportMocks(report: typeof MOCK_TALENT_REPORT = MOCK_TALENT_REPORT): MockedResponse[] {
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
      result: { data: talentReportData(report) },
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

/** Nilai StatCard di bawah labelnya (struktur `StatCard`: label lalu angka). */
function statValue(label: string): ReturnType<typeof within> {
  return within(screen.getByText(label).parentElement as HTMLElement);
}

// Populasi org-wide (amandemen 2026-10-19): role tanpa chapter tampil sebagai
// baris biasa pada distribusi role — bukan kategori/bucket khusus.
const REPORT_WITH_NON_CHAPTER_ROLE = {
  ...MOCK_TALENT_REPORT,
  roleDistribution: [
    ...MOCK_TALENT_REPORT.roleDistribution,
    { label: "Finance Admin", count: 3, kind: "VALUE" as const },
  ],
};

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
  it("renders Operation admin widgets, FR-40 indicators and the org-wide report (TAN-240)", async () => {
    renderDashboard(
      {
        __typename: "OperationDashboard",
        totalActiveEmployees: 89,
        employeesPerUnit: [
          {
            __typename: "UnitCount",
            unit: { __typename: "Unit", id: "u-1", name: "Tribe Digital Product" },
            count: 34,
          },
          {
            __typename: "UnitCount",
            unit: { __typename: "Unit", id: "u-2", name: "Tribe Network" },
            count: 22,
          },
        ],
        nonAssignableEmployees: 2,
        recentEmployeeChanges: [
          { __typename: "Employee", id: "emp-1", fullName: "Andi Pratama", nomorInduk: "EMP-001" },
        ],
        contractsExpiringIn90Days: 5,
        contractsExpiringIn30Days: 2,
        preRetirementEmployees: 3,
      },
      talentReportMocks(),
    );

    // Widget administratif + indikator FR-40.
    expect(await screen.findByText("Karyawan aktif")).toBeInTheDocument();
    expect(statValue("Karyawan aktif").getByText("89")).toBeInTheDocument();
    expect(statValue("Kontrak berakhir ≤ 90 hari").getByText("5")).toBeInTheDocument();
    expect(statValue("Kontrak berakhir ≤ 30 hari").getByText("2")).toBeInTheDocument();
    expect(statValue("Karyawan pra-pensiun").getByText("3")).toBeInTheDocument();

    expect(screen.getByText("Karyawan per Unit")).toBeInTheDocument();
    expect(screen.getByText("Tribe Digital Product")).toBeInTheDocument();
    expect(screen.getByText("Perubahan data terbaru")).toBeInTheDocument();
    expect(screen.getByText("Andi Pratama")).toBeInTheDocument();
    expect(screen.getByText("EMP-001")).toBeInTheDocument();

    // Laporan Talent tetap konten dashboard Operation (kini org-wide).
    expect(screen.getByText("Laporan Talent — seluruh unit")).toBeInTheDocument();
    expect(await screen.findByText("Talent per role")).toBeInTheDocument();
    expect(screen.getByText("Tren churn vs new talent")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Terapkan" })).toBeInTheDocument();

    // Istilah internal tidak ditampilkan (amandemen 2026-10-19).
    expect(screen.queryByText(/non-assignable/i)).toBeNull();
    expect(screen.queryByText(/Tanpa chapter/i)).toBeNull();
  });

  it("counts roles without a chapter inside the ordinary role distribution (TAN-240)", async () => {
    renderDashboard(
      {
        __typename: "OperationDashboard",
        totalActiveEmployees: 89,
        employeesPerUnit: [],
        nonAssignableEmployees: 0,
        recentEmployeeChanges: [],
        contractsExpiringIn90Days: 0,
        contractsExpiringIn30Days: 0,
        preRetirementEmployees: 0,
      },
      talentReportMocks(REPORT_WITH_NON_CHAPTER_ROLE),
    );

    // "Finance Admin" (role tanpa chapter) ikut terhitung pada distribusi role
    // yang sama — bukan bucket terpisah: n = 25 + 3. Baris grafiknya sendiri
    // digambar di kanvas (`next/dynamic`, tidak ter-mount di jsdom), jadi yang
    // diperiksa di sini adalah populasinya; data-prep diuji di
    // `talent-report.test.tsx`.
    expect(await screen.findByText("n = 28")).toBeInTheDocument();
    expect(screen.getByText("Talent per role")).toBeInTheDocument();
    expect(screen.queryByText(/non-assignable|Tanpa chapter/i)).toBeNull();

    // Widget kosong memakai catatan kosong, bukan kategori khusus.
    expect(screen.getByText("Belum ada karyawan pada unit mana pun.")).toBeInTheDocument();
    expect(screen.getByText("Belum ada perubahan data terbaru.")).toBeInTheDocument();
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
    // Dashboard Chapter tidak berubah — tanpa widget administratif Operation.
    expect(screen.queryByText("Karyawan aktif")).toBeNull();
    expect(screen.queryByText("Karyawan per Unit")).toBeNull();
    expect(screen.queryByText("Laporan Talent — seluruh unit")).toBeNull();
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