import { afterEach, describe, expect, it, vi } from "vitest";
import { notifySessionExpired, onSessionExpired } from "./session-expiry";

describe("session expiry notification", () => {
  const unsubs: Array<() => void> = [];
  afterEach(() => {
    while (unsubs.length) unsubs.pop()!();
  });

  it("invokes registered listeners when notified", () => {
    const listener = vi.fn();
    unsubs.push(onSessionExpired(listener));

    notifySessionExpired();

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("stops invoking a listener after unsubscribe", () => {
    const listener = vi.fn();
    const unsub = onSessionExpired(listener);

    unsub();
    notifySessionExpired();

    expect(listener).not.toHaveBeenCalled();
  });

  it("invokes every registered listener", () => {
    const first = vi.fn();
    const second = vi.fn();
    unsubs.push(onSessionExpired(first), onSessionExpired(second));

    notifySessionExpired();

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("allows a listener to unsubscribe during notification", () => {
    let calls = 0;
    const unsub = onSessionExpired(() => {
      calls += 1;
      unsub();
    });
    unsubs.push(unsub);

    notifySessionExpired();
    notifySessionExpired();

    expect(calls).toBe(1);
  });
});
