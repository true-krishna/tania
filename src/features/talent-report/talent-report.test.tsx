// @vitest-environment jsdom

import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { resolveChartTheme } from "./chart-theme";
import { EChart, type EChartHandle } from "./EChart";

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

describe("chart-theme (T017 / D1)", () => {
  afterEach(() => {
    for (const name of [
      "--tp-font-display",
      "--tp-text",
      "--tp-muted",
      "--tp-line",
      "--tp-primary",
      "--tp-neutral",
      "--tp-mint-ink",
      "--tp-ink-peach",
    ]) {
      document.documentElement.style.removeProperty(name);
    }
  });

  it("resolves --tp-* tokens via getComputedStyle (canvas cannot read CSS variables)", () => {
    document.documentElement.style.setProperty("--tp-primary", "#123456");
    document.documentElement.style.setProperty("--tp-mint-ink", "#0a6b5b");
    document.documentElement.style.setProperty("--tp-ink-peach", "#b3412f");

    const theme = resolveChartTheme(document.documentElement);
    expect(theme.distributionColor).toBe("#123456");
    expect(theme.newTalentColor).toBe("#0a6b5b");
    expect(theme.churnColor).toBe("#b3412f");
  });

  it("falls back to the globals.css palette when tokens are not resolvable", () => {
    const theme = resolveChartTheme(document.documentElement);
    expect(theme.distributionColor).toBe("#6246ea");
    expect(theme.missingColor).toBe("#5b6785");
    expect(theme.newTalentColor).toBe("#0e8f7a");
    expect(theme.churnColor).toBe("#b3412f");
    expect(theme.textColor).toBe("#101a47");
    expect(theme.lineColor).toBe("#dfe5f1");
  });

  it("colors churn with the red ink token (O-R4) and new talent with mint ink", () => {
    const theme = resolveChartTheme();
    expect(theme.churnColor).toMatch(/^#b3412f$/i);
    expect(theme.newTalentColor).toMatch(/^#0e8f7a$/i);
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
