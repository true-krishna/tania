// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  window.localStorage.clear();
});

// Dynamic import per test: the store caches the width at module scope, and
// `vi.resetModules()` gives each test a fresh cache — static imports cannot.
async function loadStore() {
  return import("./sidebar-width");
}

describe("sidebar width store", () => {
  it("falls back to the default when nothing is stored", async () => {
    const store = await loadStore();
    expect(store.getSidebarWidthSnapshot()).toBe(store.DEFAULT_SIDEBAR_WIDTH);
  });

  it("persists the clamped width", async () => {
    const store = await loadStore();
    store.setSidebarWidth(999);
    expect(store.getSidebarWidthSnapshot()).toBe(store.MAX_SIDEBAR_WIDTH);
    expect(window.localStorage.getItem("tania.sidebar-width")).toBe(String(store.MAX_SIDEBAR_WIDTH));
  });

  it("restores a stored width and notifies subscribers on change", async () => {
    window.localStorage.setItem("tania.sidebar-width", "320");
    const store = await loadStore();
    expect(store.getSidebarWidthSnapshot()).toBe(320);

    const listener = vi.fn();
    const unsubscribe = store.subscribeSidebarWidth(listener);
    store.setSidebarWidth(280);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getSidebarWidthSnapshot()).toBe(280);
    unsubscribe();
  });
});