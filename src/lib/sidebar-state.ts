const STORAGE_KEY = "tania.sidebar-collapsed";
const CHANGE_EVENT = "tania:sidebar-collapsed";

/** Sidebar rail widths: icon-only when collapsed, icon + label when expanded. */
export const SIDEBAR_WIDTH_EXPANDED = 240;
export const SIDEBAR_WIDTH_COLLAPSED = 72;

// Cached so `getSnapshot` returns a stable value between notifications, as
// `useSyncExternalStore` requires.
let cached: boolean | undefined;

function read(): boolean {
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

export function getSidebarCollapsedSnapshot(): boolean {
  if (cached === undefined) cached = read();
  return cached;
}

export function getSidebarCollapsedServerSnapshot(): boolean {
  return false;
}

export function subscribeSidebarCollapsed(callback: () => void): () => void {
  const onStorage = () => {
    cached = undefined;
    callback();
  };
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}

export function setSidebarCollapsed(collapsed: boolean): void {
  cached = collapsed;
  window.localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
  window.dispatchEvent(new Event(CHANGE_EVENT));
}