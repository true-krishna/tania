// @vitest-environment jsdom

import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MockedProvider, type MockedResponse } from "@apollo/client/testing";
import { GraphQLError } from "graphql";
import { resolveChartTheme } from "./chart-theme";
import { EChart, type EChartHandle } from "./EChart";
import { ChartCard } from "./ChartCard";
import {
  buildDistributionOption,
  EDUCATION_ORDER,
  GENERATION_ORDER,
  prepareDistribution,
} from "./DistributionChart";
import {
  buildMovementOption,
  canUseDivergingBars,
  MovementTrendChart,
} from "./MovementTrendChart";
import { chartFileName, downloadChart } from "./downloadChart";
import { formatMonthLabel, PeriodFilter } from "./PeriodFilter";
import {
  TALENT_REPORT_QUERY,
  TALENT_REPORT_RANGE_QUERY,
  useTalentReport,
} from "./useTalentReport";
import { TalentReportContent } from "./TalentReportPageView";
import {
  MOCK_MOVEMENT_TREND,
  MOCK_TALENT_REPORT,
  MOCK_TALENT_REPORT_EMPTY,
  MOCK_TALENT_REPORT_EMPTY_API_SHAPE,
  MOCK_TALENT_REPORT_RANGE,
} from "./mocks";
import type {
  ReportCategoryCount,
  TalentReport,
  TalentReportRange,
  TalentReportPeriodInput as TalentReportPeriod,
} from "@/generated/graphql/types";

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
vi.mock("echarts/charts", () => ({ BarChart: {}, LineChart: {}, PieChart: {} }));
vi.mock("echarts/components", () => ({
  GridComponent: {},
  TitleComponent: {},
  TooltipComponent: {},
  LegendComponent: {},
}));
vi.mock("echarts/renderers", () => ({ CanvasRenderer: {} }));

vi.stubGlobal("ResizeObserver", echartsMock.ResizeObserverStub);

const fullPeriod: TalentReportPeriod = {
  startMonth: MOCK_TALENT_REPORT_RANGE.startMonth,
  endMonth: MOCK_TALENT_REPORT_RANGE.endMonth,
};

const rangeMock: MockedResponse = {
  request: { query: TALENT_REPORT_RANGE_QUERY },
  result: {
    data: {
      talentReportRange: { __typename: "TalentReportRange", ...MOCK_TALENT_REPORT_RANGE },
    },
  },
};

function reportData(report: TalentReport) {
  const categories = (items: ReportCategoryCount[]) =>
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

function reportMock(period: TalentReportPeriod, report: TalentReport): MockedResponse {
  return {
    request: { query: TALENT_REPORT_QUERY, variables: { period } },
    result: { data: reportData(report) },
  };
}

describe("chart-theme (T017 / D1)", () => {
  afterEach(() => {
    for (const name of [
      "--tp-font-display",
      "--tp-text",
      "--tp-muted",
      "--tp-line",
      "--tp-brand-navy",
      "--tp-neutral",
      "--tp-chart-1",
      "--tp-chart-2",
      "--tp-chart-3",
    ]) {
      document.documentElement.style.removeProperty(name);
    }
  });

  it("resolves --tp-* tokens via getComputedStyle (canvas cannot read CSS variables)", () => {
    document.documentElement.style.setProperty("--tp-chart-2", "#123456");
    document.documentElement.style.setProperty("--tp-chart-3", "#0a6b5b");
    document.documentElement.style.setProperty("--tp-chart-1", "#b32318");

    const theme = resolveChartTheme(document.documentElement);
    expect(theme.distributionColor).toBe("#123456");
    expect(theme.newTalentColor).toBe("#0a6b5b");
    expect(theme.churnColor).toBe("#b32318");
  });

  it("falls back to the globals.css palette when tokens are not resolvable", () => {
    const theme = resolveChartTheme(document.documentElement);
    expect(theme.distributionColor).toBe("#2684ff");
    expect(theme.missingColor).toBe("#6b778c");
    expect(theme.newTalentColor).toBe("#168a5b");
    expect(theme.churnColor).toBe("#e1231a");
    expect(theme.textColor).toBe("#212121");
    expect(theme.lineColor).toBe("#dfe1e6");
  });

  it("maps the series onto the kit chart palette (chart-1..3) with meaning preserved", () => {
    const theme = resolveChartTheme();
    expect(theme.churnColor).toMatch(/^#e1231a$/i);
    expect(theme.distributionColor).toMatch(/^#2684ff$/i);
    expect(theme.newTalentColor).toMatch(/^#168a5b$/i);
    expect(theme.churnColor).not.toBe(theme.newTalentColor);
    expect(theme.missingColor).not.toBe(theme.distributionColor);
  });
});

describe("EChart wrapper (T018)", () => {
  afterEach(() => {
    vi.clearAllMocks();
    echartsMock.ResizeObserverStub.instances = [];
  });

  function renderEChart(option: Record<string, unknown> = {}) {
    const ref = React.createRef<EChartHandle>();
    const view = render(
      <EChart ref={ref} option={option} className="h-64" ariaLabel="Grafik uji" />,
    );
    return { ref, view };
  }

  it("inits once on the container and applies the option", () => {
    const option = { series: [{ type: "bar" }] };
    renderEChart(option);

    expect(echartsMock.init).toHaveBeenCalledTimes(1);
    const container = echartsMock.init.mock.calls[0][0];
    expect(container).toHaveClass("h-64");
    expect(container).toHaveAttribute("role", "img");
    expect(container).toHaveAttribute("aria-label", "Grafik uji");
    expect(echartsMock.instance.setOption).toHaveBeenCalledWith(option);
  });

  it("re-applies the option when it changes", () => {
    const { view } = renderEChart({ series: [] });
    const next = { series: [{ type: "line" }] };
    view.rerender(<EChart option={next} className="h-64" ariaLabel="Grafik uji" />);
    expect(echartsMock.instance.setOption).toHaveBeenLastCalledWith(next);
  });

  it("resizes on container resize and disposes on unmount", () => {
    const { view } = renderEChart();
    const observer = echartsMock.ResizeObserverStub.instances[0];
    expect(observer.observe).toHaveBeenCalledTimes(1);

    observer.callback([], observer as unknown as ResizeObserver);
    expect(echartsMock.instance.resize).toHaveBeenCalledTimes(1);

    view.unmount();
    expect(observer.disconnect).toHaveBeenCalledTimes(1);
    expect(echartsMock.instance.dispose).toHaveBeenCalledTimes(1);
  });

  it("exposes getDataURL through the imperative ref", () => {
    const { ref } = renderEChart();
    const url = ref.current?.getDataURL({
      type: "png",
      pixelRatio: 2,
      backgroundColor: "#ffffff",
    });
    expect(url).toBe("data:image/png;base64,AAAA");
    expect(echartsMock.instance.getDataURL).toHaveBeenCalledWith({
      type: "png",
      pixelRatio: 2,
      backgroundColor: "#ffffff",
    });
  });
});

describe("ChartCard (T019 / US1, US4)", () => {
  it("renders title, total subtitle and the chart slot", () => {
    render(
      <ChartCard title="Talent per role" subtitle="n = 25">
        <div data-testid="chart-slot" />
      </ChartCard>,
    );
    expect(screen.getByRole("heading", { name: "Talent per role" })).toBeInTheDocument();
    expect(screen.getByText("n = 25")).toBeInTheDocument();
    expect(screen.getByTestId("chart-slot")).toBeInTheDocument();
  });

  it("keeps the Unduh PNG action disabled until the handler is wired (T027)", () => {
    render(
      <ChartCard title="Talent per role" subtitle="n = 25">
        <div />
      </ChartCard>,
    );
    expect(screen.getByRole("button", { name: /Unduh PNG/ })).toBeDisabled();
  });

  it("invokes the download handler per card (US4 AC-3)", () => {
    const onDownload = vi.fn();
    render(
      <ChartCard title="Talent per role" subtitle="n = 25" onDownload={onDownload}>
        <div />
      </ChartCard>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Unduh PNG/ }));
    expect(onDownload).toHaveBeenCalledTimes(1);
  });
});

describe("DistributionChart data-prep (T020)", () => {
  const category = (label: string, count: number): ReportCategoryCount => ({
    label,
    count,
    kind: "VALUE",
  });

  it("sorts unordered categories largest-first (V-1 role / V-4 lokasi)", () => {
    const prepared = prepareDistribution([
      category("Bandung", 6),
      category("Jakarta", 10),
      category("Surabaya", 3),
    ]);
    expect(prepared.map((d) => d.label)).toEqual(["Jakarta", "Bandung", "Surabaya"]);
  });

  it("keeps the intrinsic order of ordinal categories (V-2 generasi / V-3 jenjang)", () => {
    const generation = prepareDistribution(
      [
        category("Gen Z", 7),
        category("Baby Boomer", 1),
        category("Milenial", 14),
        category("Gen X", 3),
      ],
      GENERATION_ORDER,
    );
    expect(generation.map((d) => d.label)).toEqual([
      "Baby Boomer",
      "Gen X",
      "Milenial",
      "Gen Z",
    ]);

    const education = prepareDistribution(
      [
        category("S2", 5),
        category("SMA/SMK Sederajat", 2),
        category("S1", 13),
        category("S3", 1),
        category("D3", 3),
      ],
      EDUCATION_ORDER,
    );
    expect(education.map((d) => d.label)).toEqual([
      "SMA/SMK Sederajat",
      "D3",
      "S1",
      "S2",
      "S3",
    ]);
  });

  it("always places MISSING last and labels OTHER as Lainnya", () => {
    const prepared = prepareDistribution([
      { label: "Belum diisi", count: 2, kind: "MISSING" },
      { label: "Out of town", count: 4, kind: "OTHER" },
      category("Jakarta", 10),
      { label: "Belum diisi", count: 1, kind: "MISSING" },
    ]);
    expect(prepared.at(-1)).toMatchObject({ label: "Belum diisi", isMissing: true });
    expect(prepared.at(-2)).toMatchObject({ label: "Belum diisi", isMissing: true });
    expect(prepared[1]).toMatchObject({ label: "Lainnya", count: 4, isMissing: false });
  });

  it("keeps backend order among equal counts and for unknown ordinal labels", () => {
    const ties = prepareDistribution([category("Bandung", 5), category("Jakarta", 5)]);
    expect(ties.map((d) => d.label)).toEqual(["Bandung", "Jakarta"]);

    const unknown = prepareDistribution(
      [category("Gen Alpha", 9), category("Gen Z", 7), category("Milenial", 14)],
      GENERATION_ORDER,
    );
    expect(unknown.map((d) => d.label)).toEqual(["Milenial", "Gen Z", "Gen Alpha"]);
  });

  it("builds the chart option with MISSING grey and the horizontal-bar axis rules (D1)", () => {
    const theme = resolveChartTheme();
    const option = buildDistributionOption(
      [
        { label: "Jakarta", count: 10, isMissing: false },
        { label: "Belum diisi", count: 2, isMissing: true },
      ],
      "bar",
      theme,
    );
    const series = (
      option as {
        series: Array<{ data: Array<{ value: number; itemStyle: { color: string } }> }>;
      }
    ).series[0];
    expect(series.data[0].itemStyle.color).toBe(theme.distributionColor);
    expect(series.data[1].itemStyle.color).toBe(theme.missingColor);
    expect((option.yAxis as { inverse?: boolean }).inverse).toBe(true);
    expect((option.xAxis as { type?: string }).type).toBe("value");

    const column = buildDistributionOption([], "column", theme);
    expect((column.xAxis as { type?: string }).type).toBe("category");
    expect((column.yAxis as { inverse?: boolean }).inverse).toBeUndefined();
  });

  it("renders judul & rentang via TitleComponent di dalam kanvas saat disuplai (T034 / SC-03)", () => {
    const theme = resolveChartTheme();
    const titled = buildDistributionOption([], "bar", theme, "Talent per role", "Januari 2025 – Oktober 2026");
    const title = (titled as { title: { text: string; subtext: string; left: string } }).title;
    expect(title.text).toBe("Talent per role");
    expect(title.subtext).toBe("Januari 2025 – Oktober 2026");
    expect(title.left).toBe("center");
    expect((titled.grid as { top: number }).top).toBe(52);

    const plain = buildDistributionOption([], "bar", theme);
    expect((plain as { title?: unknown }).title).toBeUndefined();
    expect((plain.grid as { top: number }).top).toBe(8);
  });
});

describe("PeriodFilter (T021 / FR-11)", () => {
  const range: TalentReportRange = { startMonth: "2025-01", endMonth: "2026-10" };
  const fullRange: TalentReportPeriod = { startMonth: "2025-01", endMonth: "2026-10" };

  function options(label: string): string[] {
    const select = screen.getByLabelText(label) as HTMLSelectElement;
    return Array.from(select.options).map((option) => option.value);
  }

  it("formats month labels (FR-11)", () => {
    expect(formatMonthLabel("2025-01")).toBe("Januari 2025");
    expect(formatMonthLabel("2026-10")).toBe("Oktober 2026");
  });

  it("defaults to the whole range and picks month and year separately (FR-11)", () => {
    render(<PeriodFilter range={range} value={fullRange} onApply={vi.fn()} />);
    expect(screen.getByLabelText("Bulan mulai")).toHaveValue("01");
    expect(screen.getByLabelText("Tahun mulai")).toHaveValue("2025");
    expect(screen.getByLabelText("Bulan akhir")).toHaveValue("10");
    expect(screen.getByLabelText("Tahun akhir")).toHaveValue("2026");
    // Satu pilihan per tahun rentang — daftarnya tidak memanjang per bulan.
    expect(options("Tahun mulai")).toEqual(["2025", "2026"]);
    expect(options("Bulan mulai")).toHaveLength(12);
    // Sisi akhir tetap dibatasi `talentReportRange`: Januari s.d. Oktober 2026.
    expect(options("Bulan akhir")).toEqual([
      "01",
      "02",
      "03",
      "04",
      "05",
      "06",
      "07",
      "08",
      "09",
      "10",
    ]);
  });

  it("limits the month options to the range bound in that bound's year", () => {
    const bounded: TalentReportRange = { startMonth: "2025-03", endMonth: "2026-10" };
    render(
      <PeriodFilter
        range={bounded}
        value={{ startMonth: "2025-03", endMonth: "2026-10" }}
        onApply={vi.fn()}
      />,
    );
    expect(options("Bulan mulai")).toHaveLength(10);
    expect(options("Bulan mulai")[0]).toBe("03");

    fireEvent.change(screen.getByLabelText("Tahun mulai"), { target: { value: "2026" } });
    expect(options("Bulan mulai")).toHaveLength(12);
    expect(screen.getByLabelText("Bulan mulai")).toHaveValue("03");
  });

  it("clamps the month onto the range bound when the year would leave it", () => {
    const bounded: TalentReportRange = { startMonth: "2025-03", endMonth: "2026-10" };
    render(
      <PeriodFilter
        range={bounded}
        value={{ startMonth: "2026-01", endMonth: "2026-10" }}
        onApply={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText("Tahun mulai"), { target: { value: "2025" } });
    expect(screen.getByLabelText("Bulan mulai")).toHaveValue("03");
  });

  it("applies a changed period in one action (SC-04)", () => {
    const onApply = vi.fn();
    render(<PeriodFilter range={range} value={fullRange} onApply={onApply} />);
    const apply = screen.getByRole("button", { name: "Terapkan" });
    expect(apply).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Tahun mulai"), { target: { value: "2026" } });
    expect(apply).toBeEnabled();
    fireEvent.click(apply);
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledWith({ startMonth: "2026-01", endMonth: "2026-10" });
  });

  it("clamps the pair so start never exceeds end", () => {
    const onApply = vi.fn();
    render(<PeriodFilter range={range} value={fullRange} onApply={onApply} />);
    fireEvent.change(screen.getByLabelText("Tahun mulai"), { target: { value: "2026" } });
    fireEvent.change(screen.getByLabelText("Bulan mulai"), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText("Bulan akhir"), { target: { value: "06" } });
    fireEvent.click(screen.getByRole("button", { name: "Terapkan" }));
    expect(onApply).toHaveBeenCalledWith({ startMonth: "2026-06", endMonth: "2026-06" });
  });
});

describe("useTalentReport (T022 / FR-11, FR-12, FR-15)", () => {
  function HookProbe() {
    const { period, status, report, message, applyPeriod } = useTalentReport();
    return (
      <div>
        <span data-testid="period">
          {period ? `${period.startMonth}..${period.endMonth}` : "none"}
        </span>
        <span data-testid="status">{status}</span>
        <span data-testid="top">{report?.roleDistribution[0]?.count ?? "none"}</span>
        <span data-testid="message">{message ?? ""}</span>
        <button
          type="button"
          onClick={() => applyPeriod({ startMonth: "2026-01", endMonth: "2026-10" })}
        >
          Ubah periode
        </button>
      </div>
    );
  }

  function renderHook(mocks: MockedResponse[]) {
    return render(
      <MockedProvider mocks={mocks}>
        <HookProbe />
      </MockedProvider>,
    );
  }

  it("defaults the filter to the whole available range (FR-11)", async () => {
    renderHook([rangeMock, reportMock(fullPeriod, MOCK_TALENT_REPORT)]);

    await screen.findByText("ready");
    expect(screen.getByTestId("period")).toHaveTextContent("2025-01..2026-10");
    expect(screen.getByTestId("top")).toHaveTextContent("12");
  });

  it("updates all visuals from one refetch when the period changes (SC-04)", async () => {
    const updated: TalentReport = {
      ...MOCK_TALENT_REPORT,
      roleDistribution: [{ label: "Engineer", count: 99, kind: "VALUE" }],
    };
    renderHook([
      rangeMock,
      reportMock(fullPeriod, MOCK_TALENT_REPORT),
      reportMock({ startMonth: "2026-01", endMonth: "2026-10" }, updated),
    ]);

    await screen.findByText("12");

    fireEvent.click(screen.getByRole("button", { name: "Ubah periode" }));
    await screen.findByText("99");
    expect(screen.getByTestId("period")).toHaveTextContent("2026-01..2026-10");
  });

  it("reports empty for a range without any data (edge case spek)", async () => {
    renderHook([rangeMock, reportMock(fullPeriod, MOCK_TALENT_REPORT_EMPTY)]);

    await screen.findByText("empty");
  });

  it("reports empty when the API sends zero-count categories instead of empty arrays", async () => {
    renderHook([rangeMock, reportMock(fullPeriod, MOCK_TALENT_REPORT_EMPTY_API_SHAPE)]);

    await screen.findByText("empty");
  });

  it("maps a server FORBIDDEN to the forbidden status (SC-05)", async () => {
    renderHook([
      rangeMock,
      {
        request: { query: TALENT_REPORT_QUERY, variables: { period: fullPeriod } },
        result: {
          errors: [
            new GraphQLError("Akses ditolak.", { extensions: { code: "FORBIDDEN" } }),
          ],
        },
      },
    ]);

    await screen.findByText("forbidden");
    expect(screen.getByTestId("message")).toHaveTextContent("Akses ditolak.");
  });
});

// Amandemen penempatan (TAN-154, 2026-10-12): konten laporan kini di-embed ke
// Dashboard untuk Operation/Chapter — komponennya `TalentReportContent`.
describe("TalentReportContent (T023 / SC-04, SC-05)", () => {
  function renderPage(mocks: MockedResponse[]) {
    return render(
      <MockedProvider mocks={mocks}>
        <TalentReportContent />
      </MockedProvider>,
    );
  }

  it("renders the five report cards with n = … totals", async () => {
    renderPage([rangeMock, reportMock(fullPeriod, MOCK_TALENT_REPORT)]);

    expect(await screen.findByText("Talent per role")).toBeInTheDocument();
    expect(screen.getByText("Talent per generasi")).toBeInTheDocument();
    expect(screen.getByText("Talent per jenjang pendidikan")).toBeInTheDocument();
    expect(screen.getByText("Talent per lokasi kerja")).toBeInTheDocument();
    expect(screen.getByText("Tren churn vs new talent")).toBeInTheDocument();
    expect(screen.getAllByText("n = 25")).toHaveLength(4);
    expect(screen.getByText("n = 31")).toBeInTheDocument();
  });

  it("shows the empty state with a hint to pick another range (not an error)", async () => {
    renderPage([rangeMock, reportMock(fullPeriod, MOCK_TALENT_REPORT_EMPTY)]);

    expect(
      await screen.findByText(
        "Tidak ada data pada rentang ini. Pilih rentang bulan lain untuk melihat laporan.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Terapkan" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("explains an empty range even when the API sends zero-count categories", async () => {
    renderPage([rangeMock, reportMock(fullPeriod, MOCK_TALENT_REPORT_EMPTY_API_SHAPE)]);

    expect(
      await screen.findByText(
        "Tidak ada data pada rentang ini. Pilih rentang bulan lain untuk melihat laporan.",
      ),
    ).toBeInTheDocument();
  });

  it("shows the access-denied state on FORBIDDEN (SC-05)", async () => {
    renderPage([
      rangeMock,
      {
        request: { query: TALENT_REPORT_QUERY, variables: { period: fullPeriod } },
        result: {
          errors: [
            new GraphQLError("Akses ditolak.", { extensions: { code: "FORBIDDEN" } }),
          ],
        },
      },
    ]);

    expect(await screen.findByText("Akses ditolak.")).toBeInTheDocument();
    expect(screen.queryByText("Talent per role")).toBeNull();
  });

  it("shows an error state for non-authz failures", async () => {
    renderPage([
      rangeMock,
      {
        request: { query: TALENT_REPORT_QUERY, variables: { period: fullPeriod } },
        result: { errors: [new GraphQLError("Gangguan jaringan.")] },
      },
    ]);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Gangguan jaringan.");
  });

  it("shows the loading state until the report arrives", async () => {
    renderPage([
      { ...rangeMock, delay: 100 },
      { ...reportMock(fullPeriod, MOCK_TALENT_REPORT), delay: 100 },
    ]);

    expect(screen.getByText("Memuat laporan…")).toBeInTheDocument();
    expect(await screen.findByText("Talent per role")).toBeInTheDocument();
    expect(screen.queryByText("Memuat laporan…")).toBeNull();
  });

  it("updates all five cards from one refetch when the period changes (SC-04)", async () => {
    const updated: TalentReport = {
      snapshotMonth: "2026-10",
      roleDistribution: [{ label: "Engineer", count: 99, kind: "VALUE" }],
      generationDistribution: [{ label: "Milenial", count: 50, kind: "VALUE" }],
      educationDistribution: [{ label: "S1", count: 40, kind: "VALUE" }],
      workLocationDistribution: [{ label: "Jakarta", count: 30, kind: "VALUE" }],
      movementTrend: [{ month: "2026-01", newTalent: 5, churn: 4 }],
    };
    renderPage([
      rangeMock,
      reportMock(fullPeriod, MOCK_TALENT_REPORT),
      reportMock({ startMonth: "2026-01", endMonth: "2026-10" }, updated),
    ]);

    await screen.findByText("Talent per role");
    expect(screen.getAllByText("n = 25")).toHaveLength(4);

    fireEvent.change(screen.getByLabelText("Tahun mulai"), { target: { value: "2026" } });
    fireEvent.click(screen.getByRole("button", { name: "Terapkan" }));

    expect(await screen.findByText("n = 99")).toBeInTheDocument();
    expect(screen.getByText("n = 50")).toBeInTheDocument();
    expect(screen.getByText("n = 40")).toBeInTheDocument();
    expect(screen.getByText("n = 30")).toBeInTheDocument();
    expect(screen.getByText("n = 9")).toBeInTheDocument();
    expect(screen.queryByText("n = 25")).toBeNull();
    expect(screen.getByLabelText("Tahun mulai")).toHaveValue("2026");
    expect(screen.getByLabelText("Bulan mulai")).toHaveValue("01");
  });
});

describe("MovementTrendChart (T026 / V-5)", () => {
  it("prepares a two-series line option by default, keeping zero months (US2 AC-9)", () => {
    const option = buildMovementOption(MOCK_MOVEMENT_TREND, "line", resolveChartTheme());
    const series = option.series as Array<{ type: string; data: number[]; name: string }>;
    expect(series).toHaveLength(2);
    expect(series.map((s) => s.type)).toEqual(["line", "line"]);
    expect(series[0].name).toBe("New talent");
    expect(series[1].name).toBe("Churn");
    expect(series[0].data).toEqual(MOCK_MOVEMENT_TREND.map((m) => m.newTalent));
    expect(series[1].data).toEqual(MOCK_MOVEMENT_TREND.map((m) => m.churn));
    expect(series[0].data).toContain(0);
  });

  it("renders churn as negative values in diverging-bar view (churn di bawah nol)", () => {
    const option = buildMovementOption(MOCK_MOVEMENT_TREND, "diverging", resolveChartTheme());
    const series = option.series as Array<{ type: string; data: number[] }>;
    expect(series.map((s) => s.type)).toEqual(["bar", "bar"]);
    expect(series[1].data).toEqual(MOCK_MOVEMENT_TREND.map((m) => -m.churn));
    expect(series[0].data).toEqual(MOCK_MOVEMENT_TREND.map((m) => m.newTalent));
  });

  it("renders judul & rentang via TitleComponent di dalam kanvas saat disuplai (T034 / SC-03)", () => {
    const option = buildMovementOption(
      MOCK_MOVEMENT_TREND,
      "line",
      resolveChartTheme(),
      "Tren churn vs new talent",
      "Januari 2025 – Oktober 2026",
    );
    const title = (option as { title: { text: string; subtext: string } }).title;
    expect(title.text).toBe("Tren churn vs new talent");
    expect(title.subtext).toBe("Januari 2025 – Oktober 2026");
    const legend = (option as { legend: { top?: number } }).legend;
    expect(legend.top).toBe(44);
    expect((option.grid as { top: number }).top).toBe(72);

    const plain = buildMovementOption(MOCK_MOVEMENT_TREND, "line", resolveChartTheme());
    expect((plain as { title?: unknown }).title).toBeUndefined();
  });

  it("allows the diverging toggle only up to 12 months (plan §7)", () => {
    expect(canUseDivergingBars(MOCK_MOVEMENT_TREND.slice(0, 12))).toBe(true);
    expect(canUseDivergingBars(MOCK_MOVEMENT_TREND)).toBe(false);
    const thirteen = Array.from({ length: 13 }, (_, i) => ({
      month: `2025-${String((i % 12) + 1).padStart(2, "0")}`,
      newTalent: 0,
      churn: 0,
    }));
    expect(canUseDivergingBars(thirteen)).toBe(false);
    expect(canUseDivergingBars([])).toBe(false);
  });

  it("wears the canon tab recipe, with aria-selected as the state source (V/VI)", () => {
    render(<MovementTrendChart data={MOCK_MOVEMENT_TREND.slice(0, 12)} ariaLabel="Tren" />);

    const tablist = screen.getByRole("tablist", { name: "Tampilan grafik tren" });
    expect(tablist).toHaveClass("tp-tabs");

    const line = within(tablist).getByRole("tab", { name: "Line" });
    const diverging = within(tablist).getByRole("tab", { name: "Bar divergen" });
    expect(line).toHaveClass("tp-tab");
    expect(diverging).toHaveClass("tp-tab");
    expect(line).toHaveAttribute("aria-selected", "true");
    expect(diverging).toHaveAttribute("aria-selected", "false");

    fireEvent.click(diverging);
    expect(diverging).toHaveAttribute("aria-selected", "true");
    expect(line).toHaveAttribute("aria-selected", "false");

    const panel = screen.getByRole("tabpanel");
    expect(panel).toHaveAttribute("aria-labelledby", diverging.id);
    expect(diverging).toHaveAttribute("aria-controls", panel.id);
  });

  it("keeps the diverging tab reachable with its reason when the range is too long (V-5)", () => {
    render(<MovementTrendChart data={MOCK_MOVEMENT_TREND} ariaLabel="Tren" />);

    const diverging = screen.getByRole("tab", { name: "Bar divergen" });
    expect(diverging).toHaveAttribute("aria-disabled", "true");
    expect(diverging).toHaveAttribute("title", "Bar divergen hanya untuk rentang maksimal 12 bulan");
    expect(diverging).toHaveAttribute("aria-selected", "false");

    fireEvent.click(diverging);
    expect(diverging).toHaveAttribute("aria-selected", "false");
  });
});

describe("downloadChart (T027 / FR-13/FR-14)", () => {
  it("names files <nama-grafik>-<mulai>-<akhir>.png (FR-14)", () => {
    expect(chartFileName("talent-per-role", "2025-01", "2026-10")).toBe(
      "talent-per-role-2025-01-2026-10.png",
    );
    expect(chartFileName("tren-churn-vs-new-talent", "2025-01", "2025-01")).toBe(
      "tren-churn-vs-new-talent-2025-01-2025-01.png",
    );
  });

  it("exports PNG at 2× pixel ratio with white background and downloads it (FR-13)", () => {
    const getDataURL = vi.fn(() => "data:image/png;base64,AAAA");
    const click = vi.fn();
    const createElement = vi.spyOn(document, "createElement").mockReturnValue({
      click,
      set href(_v: string) {},
      set download(_v: string) {},
    } as unknown as HTMLAnchorElement);

    downloadChart({ getDataURL }, "grafik-2025-01-2026-10.png");

    expect(getDataURL).toHaveBeenCalledWith({ pixelRatio: 2, backgroundColor: "#ffffff" });
    expect(click).toHaveBeenCalledTimes(1);
    createElement.mockRestore();
  });

  it("fails safe without a chart handle", () => {
    expect(() => downloadChart(null, "grafik.png")).not.toThrow();
  });
});
