// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  window.localStorage.clear();
});

// Dynamic import per test: the store caches the flag at module scope, and
// `vi.resetModules()` gives each test a fresh cache — static imports cannot.
async function loadStore() {
  return import("./sidebar-state");
}

describe("sidebar collapsed store", () => {
  it("defaults to expanded when nothing is stored", async () => {
    const store = await loadStore();
    expect(store.getSidebarCollapsedSnapshot()).toBe(false);
    expect(store.getSidebarCollapsedServerSnapshot()).toBe(false);
  });

  it("persists the collapsed flag", async () => {
    const store = await loadStore();
    store.setSidebarCollapsed(true);
    expect(store.getSidebarCollapsedSnapshot()).toBe(true);
    expect(window.localStorage.getItem("tania.sidebar-collapsed")).toBe("1");

    store.setSidebarCollapsed(false);
    expect(store.getSidebarCollapsedSnapshot()).toBe(false);
    expect(window.localStorage.getItem("tania.sidebar-collapsed")).toBe("0");
  });

  it("restores a stored flag and notifies subscribers on change", async () => {
    window.localStorage.setItem("tania.sidebar-collapsed", "1");
    const store = await loadStore();
    expect(store.getSidebarCollapsedSnapshot()).toBe(true);

    const listener = vi.fn();
    const unsubscribe = store.subscribeSidebarCollapsed(listener);
    store.setSidebarCollapsed(false);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getSidebarCollapsedSnapshot()).toBe(false);
    unsubscribe();
  });
});