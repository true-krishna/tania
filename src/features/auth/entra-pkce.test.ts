// @vitest-environment jsdom
//
// jsdom (not node) because the attempt is stored in `sessionStorage` — the
// callback page reads it back after a full page load. jsdom provides both
// `crypto.subtle` and Web Storage, so no mock is needed (R-11: one
// implementation, testable in Vitest).

import { beforeEach, describe, expect, it } from "vitest";
import {
  ENTRA_ATTEMPT_KEY,
  base64UrlEncode,
  beginEntraAuthAttempt,
  clearEntraAuthAttempt,
  createCodeChallenge,
  createCodeVerifier,
  randomBase64Url,
  readEntraAuthAttempt,
  saveEntraAuthAttempt,
  takeEntraAuthAttempt,
} from "./entra-pkce";

const BASE64URL = /^[A-Za-z0-9_-]+$/;

beforeEach(() => {
  sessionStorage.clear();
});

describe("base64url encoding", () => {
  it("encodes without padding and with the URL-safe alphabet", () => {
    // 0xfb 0xff 0xbf encodes to "+/+/" in plain base64 → "-_-_" in base64url.
    expect(base64UrlEncode(new Uint8Array([0xfb, 0xff, 0xbf]))).toBe("-_-_");
    expect(base64UrlEncode(new Uint8Array([]))).toBe("");
  });

  it("produces the alphabet-only strings the flow relies on", () => {
    for (let i = 0; i < 50; i += 1) {
      expect(randomBase64Url(16)).toMatch(BASE64URL);
    }
  });
});

describe("code verifier", () => {
  it("is 43 base64url characters (RFC 7636 requires 43–128)", () => {
    const verifier = createCodeVerifier();
    expect(verifier).toHaveLength(43);
    expect(verifier).toMatch(BASE64URL);
  });

  it("differs between attempts", () => {
    expect(createCodeVerifier()).not.toBe(createCodeVerifier());
  });
});

describe("code challenge (S256)", () => {
  it("is base64url(SHA-256(verifier)) — checked against the RFC 7636 vector", async () => {
    // RFC 7636 §B: verifier "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
    // → challenge "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM".
    await expect(createCodeChallenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")).resolves.toBe(
      "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
    );
  });
});

describe("attempt storage", () => {
  const attempt = { codeVerifier: "verifier-abc", state: "state-xyz", nonce: "nonce-123" };

  it("starts an attempt, stores it, and returns the matching challenge", async () => {
    const { attempt: started, codeChallenge } = await beginEntraAuthAttempt();

    expect(started.codeVerifier).toMatch(BASE64URL);
    expect(started.state).toMatch(BASE64URL);
    expect(started.nonce).toMatch(BASE64URL);
    expect(codeChallenge).toBe(await createCodeChallenge(started.codeVerifier));
    // The callback is a fresh page load, so the attempt must be readable back.
    expect(readEntraAuthAttempt()).toEqual(started);
    expect(sessionStorage.getItem(ENTRA_ATTEMPT_KEY)).not.toBeNull();
  });

  it("round-trips a saved attempt", () => {
    saveEntraAuthAttempt(attempt);
    expect(readEntraAuthAttempt()).toEqual(attempt);
  });

  it("returns null when nothing was stored, and after clearing", () => {
    expect(readEntraAuthAttempt()).toBeNull();
    saveEntraAuthAttempt(attempt);
    clearEntraAuthAttempt();
    expect(readEntraAuthAttempt()).toBeNull();
  });

  it("ignores malformed stored values instead of throwing", () => {
    sessionStorage.setItem(ENTRA_ATTEMPT_KEY, "not json");
    expect(readEntraAuthAttempt()).toBeNull();
    sessionStorage.setItem(ENTRA_ATTEMPT_KEY, JSON.stringify({ state: "only-state" }));
    expect(readEntraAuthAttempt()).toBeNull();
  });

  it("consumes the attempt exactly once (an authorization code is used once)", () => {
    saveEntraAuthAttempt(attempt);
    expect(takeEntraAuthAttempt()).toEqual(attempt);
    expect(takeEntraAuthAttempt()).toBeNull();
    expect(sessionStorage.getItem(ENTRA_ATTEMPT_KEY)).toBeNull();
  });
});
