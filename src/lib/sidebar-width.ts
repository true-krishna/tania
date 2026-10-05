const STORAGE_KEY = "tania.sidebar-width";
const CHANGE_EVENT = "tania:sidebar-width";

export const MIN_SIDEBAR_WIDTH = 200;
export const MAX_SIDEBAR_WIDTH = 400;
export const DEFAULT_SIDEBAR_WIDTH = 240;

/** Clamp to the resizable range; used by every setter so the invariant holds. */
export function clampSidebarWidth(width: number): number {
  return Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, width));
}

// Cached so `getSnapshot` returns a stable value between notifications, as
// `useSyncExternalStore` requires.
let cached: number | undefined;

function read(): number {
  const stored = Number(window.localStorage.getItem(STORAGE_KEY));
  return Number.isFinite(stored) && stored > 0 ? clampSidebarWidth(stored) : DEFAULT_SIDEBAR_WIDTH;
}

export function getSidebarWidthSnapshot(): number {
  if (cached === undefined) cached = read();
  return cached;
}

export function getSidebarWidthServerSnapshot(): number {
  return DEFAULT_SIDEBAR_WIDTH;
}

export function subscribeSidebarWidth(callback: () => void): () => void {
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

export function setSidebarWidth(width: number): void {
  cached = clampSidebarWidth(width);
  window.localStorage.setItem(STORAGE_KEY, String(cached));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}