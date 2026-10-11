// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { resolveChartTheme } from "./chart-theme";

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
