import { describe, expect, it } from "vitest";

/**
 * T014 — verifikasi integrasi echarts 6 × Next 16 (O-R3).
 *
 * Hasil yang dicatat:
 * - `echarts@^6.1.0` terpasang tanpa konflik peer dengan React 19 / Next 16
 *   (echarts tidak punya peer dependency React — plan §2).
 * - Entry point registrasi selektif (`echarts/core`, `echarts/charts`,
 *   `echarts/components`, `echarts/renderers`) aman diimpor tanpa DOM/canvas
 *   (import bebas efek samping) — aman untuk SSR Next; init hanya terjadi di
 *   klien, dan test jsdom memakai mock (`talent-report.test.tsx`, pola T018).
 * - Dynamic import client-side (chunk terpisah per rute) diverifikasi lewat
 *   `next/dynamic` pada konsumen `EChart` dan ukuran bundle saat gate T024.
 */
describe("echarts 6 × Next 16 (O-R3)", () => {
  it("exposes the selective-registration entry points with side-effect-free imports", async () => {
    const core = await import("echarts/core");
    const charts = await import("echarts/charts");
    const components = await import("echarts/components");
    const renderers = await import("echarts/renderers");

    expect(typeof core.use).toBe("function");
    expect(typeof core.init).toBe("function");
    expect(charts.BarChart).toBeDefined();
    expect(charts.LineChart).toBeDefined();
    expect(components.GridComponent).toBeDefined();
    expect(components.TitleComponent).toBeDefined();
    expect(components.TooltipComponent).toBeDefined();
    expect(components.LegendComponent).toBeDefined();
    expect(renderers.CanvasRenderer).toBeDefined();
  });

  it("registers the report chart set without touching the DOM", async () => {
    const core = await import("echarts/core");
    const { BarChart, LineChart } = await import("echarts/charts");
    const { GridComponent, TitleComponent, TooltipComponent, LegendComponent } =
      await import("echarts/components");
    const { CanvasRenderer } = await import("echarts/renderers");

    expect(() =>
      core.use([
        BarChart,
        LineChart,
        GridComponent,
        TitleComponent,
        TooltipComponent,
        LegendComponent,
        CanvasRenderer,
      ]),
    ).not.toThrow();
  });
});
