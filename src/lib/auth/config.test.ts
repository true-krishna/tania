// @vitest-environment jsdom
//
// Browser hints live in Web Storage, so these run under jsdom (the repo's
// node-default environment has no `sessionStorage`/`localStorage`).

import { beforeEach, describe, expect, it } from "vitest";
import {
  SSO_UNLINKED_TTL_MS,
  clearSsoHints,
  isSsoFallbackMarked,
  isSsoUnlinked,
  markSsoFallback,
  markSsoUnlinked,
} from "./config";
import { SSO_FALLBACK_KEY, SSO_UNLINKED_KEY } from "@/lib/constants/storage";

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});

describe("fallback marker (sessionStorage)", () => {
  it("is absent by default and set by markSsoFallback", () => {
    expect(isSsoFallbackMarked()).toBe(false);
    markSsoFallback();
    expect(isSsoFallbackMarked()).toBe(true);
    expect(sessionStorage.getItem(SSO_FALLBACK_KEY)).toBe("1");
  });

  it("lives in sessionStorage only — a new tab may try SSO again", () => {
    markSsoFallback();
    expect(localStorage.getItem(SSO_FALLBACK_KEY)).toBeNull();
  });
});

describe("unlinked marker (localStorage, 7 days)", () => {
  const now = Date.parse("2026-10-21T00:00:00Z");

  it("is absent by default and set by markSsoUnlinked", () => {
    expect(isSsoUnlinked(now)).toBe(false);
    markSsoUnlinked(now);
    expect(isSsoUnlinked(now)).toBe(true);
  });

  it("still holds one millisecond inside the window and expires at 7 days", () => {
    markSsoUnlinked(now);
    expect(isSsoUnlinked(now + SSO_UNLINKED_TTL_MS - 1)).toBe(true);
    expect(isSsoUnlinked(now + SSO_UNLINKED_TTL_MS)).toBe(false);
  });

  it("drops an expired mark so it cannot come back", () => {
    markSsoUnlinked(now);
    isSsoUnlinked(now + SSO_UNLINKED_TTL_MS);
    expect(localStorage.getItem(SSO_UNLINKED_KEY)).toBeNull();
    expect(isSsoUnlinked(now + SSO_UNLINKED_TTL_MS + 1)).toBe(false);
  });

  it("ignores a malformed mark instead of throwing", () => {
    localStorage.setItem(SSO_UNLINKED_KEY, "yesterday");
    expect(isSsoUnlinked(now)).toBe(false);
  });
});

describe("clearSsoHints", () => {
  it("clears both hints — called after a successful sign-in on either path", () => {
    markSsoFallback();
    markSsoUnlinked();
    clearSsoHints();
    expect(isSsoFallbackMarked()).toBe(false);
    expect(isSsoUnlinked()).toBe(false);
  });
});
