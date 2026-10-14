// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { gql } from "@apollo/client";
import { createApolloClient } from "./client";
import { clearSession, getSession, setSession, type Session } from "@/lib/auth/token-store";
import { onSessionExpired } from "@/lib/auth/session-expiry";

const SESSION: Session = {
  accessToken: "token-old",
  accessTokenExpiresAt: "2026-01-01T00:00:00Z",
  refreshToken: "refresh-1",
  refreshTokenExpiresAt: "2099-01-01T00:00:00Z",
  accessRole: "ADMIN",
  fullName: "Ada Lovelace",
  email: "ada@tania.id",
};

const NEXT_SESSION: Session = { ...SESSION, accessToken: "token-new", refreshToken: "refresh-2" };

function gqlResponse(body: unknown) {
  const text = JSON.stringify(body);
  return { ok: true, status: 200, text: async () => text, json: async () => body };
}

const unauthorized = {
  errors: [{ message: "token kedaluwarsa", extensions: { code: "UNAUTHENTICATED" } }],
};

const refreshRejected = { errors: [{ message: "refresh token kedaluwarsa" }] };

const refreshAccepted = {
  data: {
    refreshSession: {
      accessToken: NEXT_SESSION.accessToken,
      accessTokenExpiresAt: NEXT_SESSION.accessTokenExpiresAt,
      refreshToken: NEXT_SESSION.refreshToken,
      refreshTokenExpiresAt: NEXT_SESSION.refreshTokenExpiresAt,
      user: {
        id: "u-1",
        email: NEXT_SESSION.email,
        fullName: NEXT_SESSION.fullName,
        accessRole: NEXT_SESSION.accessRole,
        status: "ACTIVE",
      },
    },
  },
};

const PING = gql("query Ping { ping }");

function normalizeHeaders(headers: HeadersInit | undefined): Record<string, string> {
  if (headers instanceof Headers) {
    const out: Record<string, string> = {};
    headers.forEach((value, key) => {
      out[key.toLowerCase()] = value;
    });
    return out;
  }
  return Object.fromEntries(
    Object.entries((headers as Record<string, string>) ?? {}).map(([k, v]) => [k.toLowerCase(), v])
  );
}

function stubFetch(handlers: Array<() => { ok: boolean; status: number; text: () => Promise<string>; json: () => Promise<unknown> }>) {
  const calls: Array<{ headers: Record<string, string>; body: string }> = [];
  const fetchMock = vi.fn(async (_url: unknown, init?: RequestInit) => {
    const headers = normalizeHeaders(init?.headers);
    calls.push({
      headers,
      body: typeof init?.body === "string" ? init.body : "",
    });
    return handlers[Math.min(calls.length - 1, handlers.length - 1)]() as unknown as Response;
  });
  vi.stubGlobal("fetch", fetchMock);
  return { calls };
}

describe("Apollo client session expiry", () => {
  let unsubs: Array<() => void>;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_GRAPHQL_URL = "http://test.local/graphql";
    clearSession();
    unsubs = [];
  });

  afterEach(() => {
    while (unsubs.length) unsubs.pop()!();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("notifies session expiry when the refresh token is rejected", async () => {
    setSession(SESSION);
    const expired = vi.fn();
    unsubs.push(onSessionExpired(expired));
    stubFetch([() => gqlResponse(unauthorized), () => gqlResponse(refreshRejected)]);

    const client = createApolloClient();
    await expect(client.query({ query: PING, fetchPolicy: "network-only" })).rejects.toThrow(
      /Session expired/
    );

    expect(getSession()).toBeNull();
    expect(expired).toHaveBeenCalledTimes(1);
  });

  it("notifies expiry when there is no refresh token to recover with", async () => {
    setSession({ ...SESSION, refreshToken: "" });
    const expired = vi.fn();
    unsubs.push(onSessionExpired(expired));
    stubFetch([() => gqlResponse(unauthorized)]);

    const client = createApolloClient();
    // The unrecoverable branch leaves the original error as the operation's
    // result; the behaviors under test are the cleared session + notification.
    await expect(client.query({ query: PING, fetchPolicy: "network-only" })).rejects.toThrow(
      /token kedaluwarsa/
    );

    expect(getSession()).toBeNull();
    expect(expired).toHaveBeenCalledTimes(1);
  });

  it("retries with the refreshed token and does not notify", async () => {
    setSession(SESSION);
    const expired = vi.fn();
    unsubs.push(onSessionExpired(expired));
    const { calls } = stubFetch([
      () => gqlResponse(unauthorized),
      () => gqlResponse(refreshAccepted),
      () => gqlResponse({ data: { ping: "pong" } }),
    ]);

    const client = createApolloClient();
    await expect(client.query({ query: PING, fetchPolicy: "network-only" })).resolves.toEqual(
      expect.objectContaining({ data: { ping: "pong" } })
    );

    expect(expired).not.toHaveBeenCalled();
    expect(getSession()?.accessToken).toBe("token-new");
    expect(JSON.parse(calls[1].body).variables.refreshToken).toBe("refresh-1");
    expect(calls[2].headers.authorization).toBe("Bearer token-new");
  });
});
