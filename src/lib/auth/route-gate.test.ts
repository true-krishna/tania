import { describe, expect, it } from "vitest";
import { encodeSession, type Session } from "@/lib/auth/session-codec";
import { isPublicRoute, requiresSignIn, resolveSession } from "@/lib/auth/route-gate";

const NOW = Date.parse("2026-10-16T00:00:00Z");

const session = (refreshTokenExpiresAt: string): Session => ({
  accessToken: "access",
  accessTokenExpiresAt: "2026-10-15T23:00:00Z",
  refreshToken: "refresh",
  refreshTokenExpiresAt,
  accessRole: "ADMIN",
});

describe("isPublicRoute", () => {
  it("allows the login page and its subpaths", () => {
    expect(isPublicRoute("/login")).toBe(true);
    expect(isPublicRoute("/login/callback")).toBe(true);
  });

  it("treats app routes as gated", () => {
    expect(isPublicRoute("/dashboard")).toBe(false);
    expect(isPublicRoute("/")).toBe(false);
    expect(isPublicRoute("/logins")).toBe(false);
  });
});

describe("resolveSession", () => {
  it("returns null without a cookie value", () => {
    expect(resolveSession(undefined)).toBeNull();
  });

  it("returns null for a malformed cookie value", () => {
    expect(resolveSession("not-json")).toBeNull();
  });

  it("decodes a well-formed session", () => {
    const next = session("2026-11-01T00:00:00Z");
    expect(resolveSession(encodeSession(next))).toEqual(next);
  });
});

describe("requiresSignIn", () => {
  it("requires sign-in without a session", () => {
    expect(requiresSignIn(null, NOW)).toBe(true);
  });

  it("requires sign-in when the refresh token is expired", () => {
    expect(requiresSignIn(session("2026-10-15T00:00:00Z"), NOW)).toBe(true);
  });

  it("accepts a session with a live refresh token", () => {
    expect(requiresSignIn(session("2026-11-01T00:00:00Z"), NOW)).toBe(false);
  });

  it("fails closed when the expiry is unreadable", () => {
    expect(requiresSignIn(session("not-a-date"), NOW)).toBe(true);
  });
});
