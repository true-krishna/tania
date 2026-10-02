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

const SESSION: Session = {
  accessToken: "token-abc123",
  accessTokenExpiresAt: "2026-10-02T00:00:00Z",
  accessRole: "ADMIN",
};

beforeEach(() => {
  document.cookie = "tania_session=; Path=/; Max-Age=0";
});

describe("token-store codec", () => {
  it("round-trips a session through encode/decode", () => {
    expect(decodeSession(encodeSession(SESSION))).toEqual(SESSION);
  });

  it("returns null for malformed cookie values", () => {
    expect(decodeSession("not-json")).toBeNull();
    expect(decodeSession(encodeURIComponent('{"accessRole":"ADMIN"}'))).toBeNull();
  });

  it("encodes cookie-unsafe characters", () => {
    const encoded = encodeSession({
      accessToken: "a,b;c=d e",
      accessTokenExpiresAt: "2026-10-02T00:00:00Z",
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