import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { encodeSession, type Session } from "@/lib/auth/session-codec";
import { SESSION_COOKIE } from "@/lib/constants/storage";

const validSession: Session = {
  accessToken: "access",
  accessTokenExpiresAt: "2026-10-16T00:30:00Z",
  refreshToken: "refresh",
  refreshTokenExpiresAt: "2099-01-01T00:00:00Z",
  accessRole: "ADMIN",
};

const expiredSession: Session = {
  ...validSession,
  refreshTokenExpiresAt: "2000-01-01T00:00:00Z",
};

function request(pathname: string, cookie?: string): NextRequest {
  return new NextRequest(`https://tania.test${pathname}`, {
    headers: cookie ? { cookie } : {},
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("proxy session gate", () => {
  it("redirects to /login without a session", () => {
    const response = proxy(request("/dashboard"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://tania.test/login");
  });

  it("redirects to /login when the refresh token is expired", () => {
    const cookie = `${SESSION_COOKIE}=${encodeSession(expiredSession)}`;
    const response = proxy(request("/dashboard", cookie));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://tania.test/login");
  });

  it("lets a valid session through", () => {
    const cookie = `${SESSION_COOKIE}=${encodeSession(validSession)}`;
    const response = proxy(request("/dashboard", cookie));
    expect(response.headers.get("location")).toBeNull();
    expect(response.status).toBe(200);
  });

  it("lets the login route through without a session", () => {
    const response = proxy(request("/login"));
    expect(response.headers.get("location")).toBeNull();
  });

  it("does not gate when AUTH_LOCAL_ONLY is set", () => {
    vi.stubEnv("NEXT_PUBLIC_AUTH_LOCAL_ONLY", "1");
    const response = proxy(request("/dashboard"));
    expect(response.headers.get("location")).toBeNull();
  });
});
