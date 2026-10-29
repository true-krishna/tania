// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";
import {
  clearSession,
  decodeSession,
  encodeSession,
  getSession,
  setSession,
  type Session,
} from "./token-store";
import { SESSION_COOKIE } from "@/lib/constants/storage";

const SESSION: Session = {
  accessToken: "token-abc123",
  accessTokenExpiresAt: "2026-10-02T00:00:00Z",
  refreshToken: "refresh-xyz789",
  refreshTokenExpiresAt: "2026-10-09T00:00:00Z",
  accessRole: "ADMIN",
  fullName: "Yudi Krisnandi",
  email: "yudi.krisnandi@digitaltelkom.id",
};

beforeEach(() => {
  document.cookie = `${SESSION_COOKIE}=; Path=/; Max-Age=0`;
});

describe("token-store codec", () => {
  it("round-trips a session through encode/decode", () => {
    expect(decodeSession(encodeSession(SESSION))).toEqual(SESSION);
  });

  it("returns null for malformed cookie values", () => {
    expect(decodeSession("not-json")).toBeNull();
    expect(decodeSession(encodeURIComponent('{"accessRole":"ADMIN"}'))).toBeNull();
  });

  it("decodes a session stored before the profile fields existed", () => {
    const legacy = encodeURIComponent(
      JSON.stringify({
        accessToken: "t",
        accessTokenExpiresAt: "2026-10-02T00:00:00Z",
        refreshToken: "r",
        refreshTokenExpiresAt: "2026-10-09T00:00:00Z",
        accessRole: "TALENT",
      }),
    );
    const decoded = decodeSession(legacy);
    expect(decoded?.accessRole).toBe("TALENT");
    expect(decoded?.fullName).toBeUndefined();
    expect(decoded?.email).toBeUndefined();
  });

  it("encodes cookie-unsafe characters", () => {
    const encoded = encodeSession({
      accessToken: "a,b;c=d e",
      accessTokenExpiresAt: "2026-10-02T00:00:00Z",
      refreshToken: "x;y,z=w q",
      refreshTokenExpiresAt: "2026-10-09T00:00:00Z",
      accessRole: "TALENT",
    });
    expect(encoded).not.toContain(";");
    expect(encoded).not.toContain(",");
  });
});

describe("token-store cookie persistence", () => {
  it("persists a session to a cookie and reads it back", () => {
    setSession(SESSION);
    expect(getSession()).toEqual(SESSION);
  });

  it("clears the session cookie", () => {
    setSession(SESSION);
    clearSession();
    expect(getSession()).toBeNull();
  });

  it("treats a missing cookie as no session", () => {
    expect(getSession()).toBeNull();
  });
});

describe("token-store remember me (Ingat saya)", () => {
  /** jsdom's `document.cookie` getter hides attributes (Max-Age), so capture
   * the raw cookie writes instead. */
  function captureCookieWrites() {
    const writes: string[] = [];
    let value = "";
    Object.defineProperty(document, "cookie", {
      configurable: true,
      get: () => value,
      set: (next: string) => {
        writes.push(next);
        value = next;
      },
    });
    return {
      writes,
      restore: () => Reflect.deleteProperty(document, "cookie"),
    };
  }

  it("writes a persistent Max-Age cookie when remember is set", () => {
    const capture = captureCookieWrites();
    try {
      setSession(SESSION, { remember: true });
      expect(getSession()).toEqual(SESSION);
      expect(capture.writes.join(" ")).toContain("Max-Age=2592000");
    } finally {
      capture.restore();
    }
  });

  it("keeps the cookie session-scoped without remember", () => {
    const capture = captureCookieWrites();
    try {
      setSession(SESSION);
      expect(getSession()).toEqual(SESSION);
      expect(capture.writes.join(" ")).not.toContain("Max-Age=");
    } finally {
      capture.restore();
    }
  });
});
