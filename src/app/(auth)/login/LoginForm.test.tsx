// @vitest-environment jsdom
//
// Component tests for the SSO-first `/login` (T026 · FR-001/FR-002/FR-009 · D8).
// The PKCE primitives themselves are covered in
// `src/features/auth/entra-pkce.test.ts`; here the subject is the page's
// decision: redirect once, or show the email door and never redirect again.

import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { EntraSsoStartDocument, LoginDocument } from "@/generated/graphql";
import * as tokenStore from "@/lib/auth/token-store";
import { SSO_UNLINKED_TTL_MS, markSsoFallback, markSsoUnlinked } from "@/lib/auth/config";
import { SSO_FALLBACK_KEY } from "@/lib/constants/storage";
import { ENTRA_ATTEMPT_KEY } from "@/features/auth/entra-pkce";
import LoginForm from "./LoginForm";

const routerReplace = vi.fn();
const locationReplace = vi.fn();
let params = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: routerReplace }),
  useSearchParams: () => params,
}));

const AUTHORIZATION_URL =
  "https://login.microsoftonline.com/tenant/oauth2/v2.0/authorize?client_id=abc&code_challenge=xyz";

/**
 * `entraSsoStart` is called with a fresh PKCE challenge/state/nonce every load,
 * so the mock matches on the operation and not on the variable values.
 */
function ssoStartMock(enabled: boolean, authorizationUrl: string | null = null) {
  return {
    request: { query: EntraSsoStartDocument },
    variableMatcher: () => true,
    result: {
      data: { entraSsoStart: { __typename: "EntraSsoStart", enabled, authorizationUrl } },
    },
  };
}

function renderLogin(mocks: unknown[]) {
  return render(
    <MockedProvider mocks={mocks as never}>
      <LoginForm />
    </MockedProvider>
  );
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_AUTH_LOCAL_ONLY = "0";
  delete process.env.NEXT_PUBLIC_DEFAULT_ACCESS_ROLE;
  params = new URLSearchParams();
  routerReplace.mockClear();
  locationReplace.mockClear();
  sessionStorage.clear();
  localStorage.clear();
  tokenStore.clearSession();
  // jsdom cannot navigate; swapping `location` keeps `replace` observable.
  const original = window.location;
  Object.defineProperty(window, "location", {
    configurable: true,
    writable: true,
    value: { ...original, replace: locationReplace, search: "" },
  });
});

describe("auto-redirect sekali ke Microsoft (D8)", () => {
  it("hands the browser to the authorization URL when SSO is active and no hint is set", async () => {
    renderLogin([ssoStartMock(true, AUTHORIZATION_URL)]);

    await waitFor(() => expect(locationReplace).toHaveBeenCalledTimes(1));
    expect(locationReplace).toHaveBeenCalledWith(AUTHORIZATION_URL);
    // The attempt must survive the navigation: the callback page reads it back.
    expect(sessionStorage.getItem(ENTRA_ATTEMPT_KEY)).not.toBeNull();
    // SSO is the main door: the email form is not what the visitor sees first.
    expect(screen.queryByLabelText(/email kerja/i)).not.toBeInTheDocument();
  });

  it("shows the email form and does not redirect when the fallback hint is set", async () => {
    markSsoFallback();
    renderLogin([ssoStartMock(true, AUTHORIZATION_URL)]);

    expect(await screen.findByLabelText(/email kerja/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    expect(locationReplace).not.toHaveBeenCalled();
  });

  it("shows the email form and does not redirect when the unlinked hint is set", async () => {
    markSsoUnlinked();
    renderLogin([ssoStartMock(true, AUTHORIZATION_URL)]);

    expect(await screen.findByLabelText(/email kerja/i)).toBeInTheDocument();
    expect(locationReplace).not.toHaveBeenCalled();
  });

  it("ignores an unlinked hint older than 7 days", async () => {
    markSsoUnlinked(Date.now() - SSO_UNLINKED_TTL_MS - 1);
    renderLogin([ssoStartMock(true, AUTHORIZATION_URL)]);

    await waitFor(() => expect(locationReplace).toHaveBeenCalledTimes(1));
  });

  it("shows the email form directly when SSO is inactive — no dangling SSO button", async () => {
    renderLogin([ssoStartMock(false)]);

    expect(await screen.findByLabelText(/email kerja/i)).toBeInTheDocument();
    expect(locationReplace).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: /masuk dengan microsoft/i })).not.toBeInTheDocument();
  });

  it("shows the email form and reports the failure when the SSO query fails", async () => {
    renderLogin([
      {
        request: { query: EntraSsoStartDocument },
        variableMatcher: () => true,
        error: new Error("network"),
      },
    ]);

    expect(await screen.findByLabelText(/email kerja/i)).toBeInTheDocument();
    expect(await screen.findByText(/masuk dengan microsoft sedang tidak tersedia/i)).toBeInTheDocument();
    expect(locationReplace).not.toHaveBeenCalled();
  });
});

describe("pintu email selalu terlihat dan menghentikan pengalihan (D8 (i))", () => {
  it("offers the email door while SSO is active, and choosing it sets the hint", async () => {
    renderLogin([ssoStartMock(true, AUTHORIZATION_URL)]);

    const door = await screen.findByRole("button", { name: /masuk dengan email & kata sandi/i });
    fireEvent.click(door);

    expect(await screen.findByLabelText(/email kerja/i)).toBeInTheDocument();
    expect(sessionStorage.getItem(SSO_FALLBACK_KEY)).toBe("1");
  });

  it("lets the visitor retry Microsoft from the email form", async () => {
    markSsoFallback();
    renderLogin([ssoStartMock(true, AUTHORIZATION_URL)]);

    fireEvent.click(await screen.findByRole("button", { name: /masuk dengan microsoft/i }));

    expect(locationReplace).toHaveBeenCalledWith(AUTHORIZATION_URL);
  });
});

describe("kembali dari Microsoft (?sso=)", () => {
  it("sets the hint, explains the cancellation and does not redirect again", async () => {
    params = new URLSearchParams("sso=cancelled");
    renderLogin([ssoStartMock(true, AUTHORIZATION_URL)]);

    expect(await screen.findByRole("alert")).toHaveTextContent(/masuk dengan microsoft dibatalkan/i);
    expect(screen.getByLabelText(/email kerja/i)).toBeInTheDocument();
    expect(sessionStorage.getItem(SSO_FALLBACK_KEY)).toBe("1");
    expect(locationReplace).not.toHaveBeenCalled();
  });

  it("explains an error return the same way", async () => {
    params = new URLSearchParams("sso=error");
    renderLogin([ssoStartMock(true, AUTHORIZATION_URL)]);

    expect(await screen.findByRole("alert")).toHaveTextContent(/masuk dengan microsoft gagal/i);
    expect(locationReplace).not.toHaveBeenCalled();
  });
});

describe("jalur email + kata sandi (FR-002 — tidak boleh teregresi)", () => {
  it("signs in, clears the SSO hints and goes to the dashboard", async () => {
    markSsoFallback();
    markSsoUnlinked();
    renderLogin([
      ssoStartMock(true, AUTHORIZATION_URL),
      {
        request: {
          query: LoginDocument,
          variables: { input: { email: "ada@tania.id", password: "secret" } },
        },
        result: {
          data: {
            login: {
              accessToken: "token-abc",
              accessTokenExpiresAt: "2026-10-02T00:00:00Z",
              refreshToken: "refresh-xyz",
              refreshTokenExpiresAt: "2026-10-09T00:00:00Z",
              user: {
                id: "u-1",
                email: "ada@tania.id",
                fullName: "Ada Lovelace",
                accessRole: "ADMIN",
                status: "ACTIVE",
              },
            },
          },
        },
      },
    ]);

    fireEvent.change(await screen.findByLabelText(/email kerja/i), {
      target: { value: "ada@tania.id" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: /masuk ke workspace/i }));

    await waitFor(() => {
      expect(tokenStore.getSession()?.accessToken).toBe("token-abc");
      expect(routerReplace).toHaveBeenCalledWith("/dashboard");
    });
    expect(sessionStorage.getItem(SSO_FALLBACK_KEY)).toBeNull();
    expect(localStorage.getItem("tania:sso:unlinked")).toBeNull();
  });
});
