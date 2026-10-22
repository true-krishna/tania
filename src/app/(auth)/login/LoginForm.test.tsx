// @vitest-environment jsdom
//
// Component tests for the SSO-first `/login` (T026 · FR-001/FR-002/FR-009 · D8′).
// The PKCE primitives themselves are covered in
// `src/features/auth/entra-pkce.test.ts`; here the subject is the page's
// decision: offer Microsoft as the main door, never navigate on mount, and put
// the email + password form behind "Login by Email".

import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { EntraSsoStartDocument, LoginDocument } from "@/generated/graphql";
import * as tokenStore from "@/lib/auth/token-store";
import { ENTRA_ATTEMPT_KEY } from "@/features/auth/entra-pkce";
import LoginForm from "./LoginForm";

const routerReplace = vi.fn();
const locationAssign = vi.fn();
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

const EMAIL_LABEL = /email kerja/i;
const MICROSOFT = { name: /continue with microsoft/i };
const EMAIL_DOOR = { name: /login by email/i };

beforeEach(() => {
  process.env.NEXT_PUBLIC_AUTH_LOCAL_ONLY = "0";
  delete process.env.NEXT_PUBLIC_DEFAULT_ACCESS_ROLE;
  params = new URLSearchParams();
  routerReplace.mockClear();
  locationAssign.mockClear();
  sessionStorage.clear();
  localStorage.clear();
  tokenStore.clearSession();
  // jsdom cannot navigate; swapping `location` keeps `assign` observable.
  const original = window.location;
  Object.defineProperty(window, "location", {
    configurable: true,
    writable: true,
    value: { ...original, assign: locationAssign, search: "" },
  });
});

describe("tombol Microsoft selalu tampil, tanpa pengalihan otomatis (D8′)", () => {
  it("offers the Microsoft button and never navigates while the page is open", async () => {
    renderLogin([ssoStartMock(true, AUTHORIZATION_URL)]);

    expect(await screen.findByRole("button", MICROSOFT)).toBeInTheDocument();
    expect(screen.queryByLabelText(EMAIL_LABEL)).not.toBeInTheDocument();
    // The authorization URL is ready, but the browser stays put until a click.
    await waitFor(() => expect(sessionStorage.getItem(ENTRA_ATTEMPT_KEY)).not.toBeNull());
    expect(locationAssign).not.toHaveBeenCalled();
  });

  it("hands the browser to Microsoft on click", async () => {
    renderLogin([ssoStartMock(true, AUTHORIZATION_URL)]);

    // The button stays disabled until the authorization URL has arrived.
    const button = await screen.findByRole("button", MICROSOFT);
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);

    expect(locationAssign).toHaveBeenCalledWith(AUTHORIZATION_URL);
    // The attempt must survive the navigation: the callback page reads it back.
    expect(sessionStorage.getItem(ENTRA_ATTEMPT_KEY)).not.toBeNull();
  });

  it("opens the email + password form in place from the Login by Email link", async () => {
    renderLogin([ssoStartMock(true, AUTHORIZATION_URL)]);

    fireEvent.click(await screen.findByRole("button", EMAIL_DOOR));

    expect(await screen.findByLabelText(EMAIL_LABEL)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(locationAssign).not.toHaveBeenCalled();
    expect(routerReplace).not.toHaveBeenCalled();
  });
});

describe("SSO tidak aktif atau gagal (tanpa tombol menggantung)", () => {
  it("shows only the email form when entraSsoStart answers enabled=false", async () => {
    renderLogin([ssoStartMock(false)]);

    expect(await screen.findByLabelText(EMAIL_LABEL)).toBeInTheDocument();
    expect(screen.queryByRole("button", MICROSOFT)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", EMAIL_DOOR)).not.toBeInTheDocument();
    expect(locationAssign).not.toHaveBeenCalled();
  });

  it("falls back to the email form and says so when the SSO query fails", async () => {
    renderLogin([
      {
        request: { query: EntraSsoStartDocument },
        variableMatcher: () => true,
        error: new Error("network"),
      },
    ]);

    expect(await screen.findByLabelText(EMAIL_LABEL)).toBeInTheDocument();
    expect(
      await screen.findByText(/masuk dengan microsoft sedang tidak tersedia/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", MICROSOFT)).not.toBeInTheDocument();
    expect(locationAssign).not.toHaveBeenCalled();
  });
});

describe("kembali dari Microsoft (?sso=)", () => {
  it("explains a cancellation without navigating anywhere", async () => {
    params = new URLSearchParams("sso=cancelled");
    renderLogin([ssoStartMock(true, AUTHORIZATION_URL)]);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /masuk dengan microsoft dibatalkan/i,
    );
    expect(await screen.findByRole("button", MICROSOFT)).toBeInTheDocument();
    expect(screen.queryByLabelText(EMAIL_LABEL)).not.toBeInTheDocument();
    expect(locationAssign).not.toHaveBeenCalled();
  });

  it("explains an error return and still lets the visitor open the email form", async () => {
    params = new URLSearchParams("sso=error");
    renderLogin([ssoStartMock(true, AUTHORIZATION_URL)]);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /masuk dengan microsoft gagal/i,
    );
    fireEvent.click(screen.getByRole("button", EMAIL_DOOR));
    expect(await screen.findByLabelText(EMAIL_LABEL)).toBeInTheDocument();
    expect(locationAssign).not.toHaveBeenCalled();
  });
});

describe("jalur email + kata sandi (FR-002 — tidak boleh teregresi)", () => {
  it("signs in and goes to the dashboard", async () => {
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

    fireEvent.click(await screen.findByRole("button", EMAIL_DOOR));
    fireEvent.change(await screen.findByLabelText(EMAIL_LABEL), {
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
    expect(locationAssign).not.toHaveBeenCalled();
  });
});
