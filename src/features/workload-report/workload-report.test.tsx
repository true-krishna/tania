// @vitest-environment jsdom

import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

const h = vi.hoisted(() => ({
  params: new URLSearchParams(),
  replace: vi.fn(),
  role: { current: "OPERATION" as string | null },
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => h.params,
  useRouter: () => ({ replace: h.replace, push: vi.fn() }),
}));

vi.mock("@/lib/auth/guard", () => ({
  useSessionRole: () => h.role.current,
}));

const echartsMock = vi.hoisted(() => {
  const instance = {
    setOption: vi.fn(),
    resize: vi.fn(),
    dispose: vi.fn(),
    getDataURL: vi.fn(() => "data:image/png;base64,AAAA"),
  };
  class ResizeObserverStub {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  return {
    instance,
    use: vi.fn(),
    init: vi.fn(() => instance),
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

import { getExecutiveFixture } from "./mocks";
import { ExecutiveReportView } from "./ExecutiveReportView";
import { TalentWorkloadView } from "./TalentWorkloadView";

beforeEach(() => {
  h.params = new URLSearchParams();
  h.role.current = "OPERATION";
  h.replace.mockReset();
});

async function renderExecutive() {
  render(<ExecutiveReportView />);
  await screen.findByText("Distribusi beban");
}

describe("ExecutiveReportView — KPI, chart & distribusi dari data (TAN-229/230/231)", () => {
  it("renders executive KPIs and both overview charts with mock data", async () => {
    await renderExecutive();

    expect(screen.getByText("Total talent")).toBeInTheDocument();
    expect(screen.getAllByText("Overload").length).toBeGreaterThan(0);
    expect(
      await screen.findByRole("img", { name: "Grafik batang total talent per klasifikasi beban" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Grafik garis status workload dari waktu ke waktu" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lihat talent Digital Core" })).toBeInTheDocument();
  });

  it("drills a tribe row down to its constituent talents", async () => {
    await renderExecutive();

    fireEvent.click(screen.getByRole("button", { name: "Lihat talent Digital Core" }));

    expect(await screen.findByText("Rani Puspita")).toBeInTheDocument();
    expect(screen.getByText("Citra Lestari")).toBeInTheDocument();
    expect(screen.queryByText("Gita Hapsari")).toBeNull();
  });

  it("switches to talent dimension and filters rows by workload status", async () => {
    await renderExecutive();

    fireEvent.change(screen.getByLabelText("Dimensi distribusi"), { target: { value: "talent" } });
    expect(await screen.findByText("Sinta Mahesa")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Filter status beban"), { target: { value: "Overload" } });

    expect(screen.getByText("Rani Puspita")).toBeInTheDocument();
    expect(screen.getByText("Citra Lestari")).toBeInTheDocument();
    expect(screen.queryByText("Sinta Mahesa")).toBeNull();
  });

  it("renders the normalized variant with its own columns", async () => {
    await renderExecutive();

    fireEvent.change(screen.getByLabelText("Varian tabel distribusi"), {
      target: { value: "normalized" },
    });

    expect(await screen.findByText("Aktivitas ternormalisasi")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lihat talent Digital Core" })).toBeNull();
  });

  it("renders analytics tables with Grand Total rows", async () => {
    await renderExecutive();

    fireEvent.click(screen.getByRole("tab", { name: "Analytics Insights" }));

    expect(await screen.findByText("Actual & Estimated Workload")).toBeInTheDocument();
    expect(screen.getAllByText("Grand Total").length).toBeGreaterThan(0);
    expect(screen.getByText("Need Improvement")).toBeInTheDocument();
  });
});

describe("ExecutiveReportView — RBAC & role gate (TAN-229)", () => {
  it("hides the cost & revenue tab and the cost column for roles without access", async () => {
    h.role.current = "CHAPTER";
    await renderExecutive();

    expect(screen.queryByRole("tab", { name: "Cost & Revenue" })).toBeNull();
    expect(screen.queryByText("Biaya talent")).toBeNull();
  });

  it("shows cost & revenue KPIs for an entitled role", async () => {
    await renderExecutive();

    fireEvent.click(screen.getByRole("tab", { name: "Cost & Revenue" }));

    expect(await screen.findByText("Rp 766.000.000")).toBeInTheDocument();
    expect(screen.getByText("Estimasi total biaya talent")).toBeInTheDocument();
    expect(screen.getByText("RBV per bulan")).toBeInTheDocument();
  });

  it("renders nothing for TALENT", () => {
    h.role.current = "TALENT";
    const { container } = render(<ExecutiveReportView />);

    expect(container).toBeEmptyDOMElement();
  });
});

describe("ExecutiveReportView — period selector & state matrix (TAN-228/235)", () => {
  it("keeps only the period id in the URL and follows it across panels", async () => {
    await renderExecutive();

    fireEvent.change(screen.getByLabelText("Pilih periode laporan workload"), {
      target: { value: "202608" },
    });

    expect(h.replace).toHaveBeenCalledWith("/workload/executive?period=202608");
  });

  it("renders figures of the selected period", async () => {
    h.params = new URLSearchParams("period=202608");
    render(<ExecutiveReportView />);

    const fixture = getExecutiveFixture("202608");
    expect(await screen.findByText(fixture!.summary!.totalTimespent)).toBeInTheDocument();
  });

  it("shows the informative empty state for a period without data", async () => {
    h.params = new URLSearchParams("period=202607");
    render(<ExecutiveReportView />);

    expect(await screen.findByText(/Belum ada data workload untuk periode Juli 2026/)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("flags the unavailable source and keeps last-known figures visible", async () => {
    h.params = new URLSearchParams("period=202606");
    render(<ExecutiveReportView />);

    expect(
      await screen.findByText(/Tidak dapat menghubungi sumber data WAD/),
    ).toBeInTheDocument();
    const fixture = getExecutiveFixture("202606");
    expect(await screen.findByText(fixture!.summary!.totalTimespent)).toBeInTheDocument();
  });

  it("shows the stale marker when the stamp passes the threshold while the source is up", async () => {
    h.params = new URLSearchParams("period=202608");
    render(<ExecutiveReportView />);

    expect(await screen.findByText(/Data lama — terakhir diperbarui/)).toBeInTheDocument();
    expect(screen.queryByText(/Tidak dapat menghubungi sumber data WAD/)).toBeNull();
    const fixture = getExecutiveFixture("202608");
    expect(screen.getByText(fixture!.summary!.totalTimespent)).toBeInTheDocument();
  });

  it("shows the loading skeleton before the period resolves", () => {
    render(<ExecutiveReportView />);

    expect(screen.getByText("Memuat data workload…")).toBeInTheDocument();
  });
});

describe("AnalyticsTables — logged vs estimated & TTD compliance (TAN-232)", () => {
  type AnalyticsRow = { statusLoad: string } & Record<string, number | null>;

  /** Header label → field pada `LoggedVsEstimatedRow` / `TtdComplianceRow`. */
  const HEADER_TO_KEY: Record<string, string> = {
    Overload: "overload",
    Stretch: "stretch",
    Fit: "fit",
    Underload: "underload",
    "Undefined Time Spent": "undefinedTimespent",
    "Undefined Activity": "undefinedActivity",
    "Grand Total": "total",
    Total: "total",
    "Need Improvement": "notAchieved",
    Fair: "lowAchieved",
    Good: "achieved",
    "Very Good": "highAchieved",
  };

  /** Setiap sel harus tampil persis seperti datanya — `null` tampil sebagai 0. */
  function expectCellsFromData(table: HTMLElement, rows: readonly AnalyticsRow[]) {
    const headers = within(table)
      .getAllByRole("columnheader")
      .map((th) => (th.textContent ?? "").trim());
    const body = table.querySelector("tbody");
    if (!body) throw new Error("analytics table has no tbody");
    const bodyRows = within(body).getAllByRole("row");
    expect(bodyRows).toHaveLength(rows.length);

    rows.forEach((row, rowIndex) => {
      const tr = bodyRows[rowIndex];
      expect((within(tr).getByRole("rowheader").textContent ?? "").trim()).toBe(row.statusLoad);
      const cells = within(tr).getAllByRole("cell");
      expect(cells).toHaveLength(headers.length - 1);
      headers.slice(1).forEach((header, columnIndex) => {
        const key = HEADER_TO_KEY[header];
        expect(key).toBeDefined();
        expect(cells[columnIndex].textContent).toBe(String(row[key] ?? 0));
      });
    });
  }

  async function openAnalyticsTab() {
    await renderExecutive();
    fireEvent.click(screen.getByRole("tab", { name: "Analytics Insights" }));
    await screen.findByText("Actual & Estimated Workload");
  }

  it("renders both tables with every status row and the Grand Total row", async () => {
    await openAnalyticsTab();

    expect(screen.getAllByText("Grand Total", { selector: "th[scope=row]" })).toHaveLength(2);

    const tables = screen.getAllByRole("table");
    expect(tables).toHaveLength(2);
    const analytics = getExecutiveFixture("202609")!.analytics!;

    expectCellsFromData(tables[0], analytics.loggedVsEstimated as unknown as AnalyticsRow[]);
    expectCellsFromData(tables[1], analytics.ttdCompliance as unknown as AnalyticsRow[]);
  });

  it("renders rows without data as 0 and follows the period selector", async () => {
    // Premis uji: pada 202608 tak ada talent Overload — barisnya harus tampil nol, bukan kosong.
    const analytics = getExecutiveFixture("202608")!.analytics!;
    expect(analytics.loggedVsEstimated.find((row) => row.statusLoad === "Overload")?.total).toBe(0);

    h.params = new URLSearchParams("period=202608");
    render(<ExecutiveReportView />);
    fireEvent.click(await screen.findByRole("tab", { name: "Analytics Insights" }));
    await screen.findByText("Actual & Estimated Workload");

    const tables = screen.getAllByRole("table");
    expect(tables).toHaveLength(2);
    expectCellsFromData(tables[0], analytics.loggedVsEstimated as unknown as AnalyticsRow[]);
    expectCellsFromData(tables[1], analytics.ttdCompliance as unknown as AnalyticsRow[]);

    const overloadRow = within(tables[0]).getAllByText("Overload", { selector: "th[scope=row]" })[0];
    const overloadCells = within(overloadRow.closest("tr")!).getAllByRole("cell");
    expect(overloadCells.map((td) => td.textContent)).toEqual(["0", "0", "0", "0", "0", "0", "0"]);
  });
});

describe("TalentWorkloadView — summary, charts & backlog (TAN-233/234)", () => {
  it("renders summary, charts and the backlog table for the selected talent", async () => {
    render(<TalentWorkloadView />);

    expect((await screen.findAllByText(/Rani Puspita/)).length).toBeGreaterThan(0);
    await screen.findByText("135%");
    expect(screen.getByText("Beban (FTE)")).toBeInTheDocument();
    expect(
      await screen.findByRole("img", { name: "Grafik garis tren backlog dan persentase beban" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Grafik pie status progress aktivitas" }),
    ).toBeInTheDocument();
    expect(screen.getByText("TAN-240")).toBeInTheDocument();
    expect(screen.getAllByText("TAN-249").length).toBeGreaterThan(0);
  });

  it("filters backlog rows by search without changing the URL", async () => {
    render(<TalentWorkloadView />);
    await screen.findByText("TAN-240");

    fireEvent.change(screen.getByLabelText("Cari aktivitas"), { target: { value: "audit" } });

    expect(screen.getByText("Tambah audit trail perubahan kontrak")).toBeInTheDocument();
    expect(screen.queryByText("Perbaiki validasi form assignment")).toBeNull();
    expect(h.replace).not.toHaveBeenCalled();
  });

  it("shows the normalized variant with filled vs normalized time spent", async () => {
    render(<TalentWorkloadView />);
    await screen.findByText("TAN-240");

    fireEvent.click(screen.getByRole("tab", { name: "Ternormalisasi" }));

    expect(await screen.findByText("Normalized Time Spent")).toBeInTheDocument();
    expect(screen.getAllByText(/jam/).length).toBeGreaterThan(0);
  });

  it("changes the talent context in-page and never in the URL", async () => {
    render(<TalentWorkloadView />);
    await screen.findAllByText(/Rani Puspita/);

    fireEvent.change(screen.getByLabelText("Pilih talent"), { target: { value: "tal-09" } });

    expect((await screen.findAllByText(/Gita Hapsari/)).length).toBeGreaterThan(0);
    expect(h.replace).not.toHaveBeenCalled();
  });

  it("keeps only the period id in the URL when the period changes", async () => {
    render(<TalentWorkloadView />);
    await screen.findAllByText(/Rani Puspita/);

    fireEvent.change(screen.getByLabelText("Pilih periode laporan talent"), {
      target: { value: "202608" },
    });

    expect(h.replace).toHaveBeenCalledWith("/workload/talent?period=202608");
  });

  it("shows the stale marker for the stale period while the source is up", async () => {
    h.params = new URLSearchParams("period=202608");
    render(<TalentWorkloadView />);

    expect(await screen.findByText(/Data lama — terakhir diperbarui/)).toBeInTheDocument();
    expect(screen.queryByText(/Tidak dapat menghubungi sumber data WAD/)).toBeNull();
  });
});
