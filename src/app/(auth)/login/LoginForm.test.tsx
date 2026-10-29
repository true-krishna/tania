// @vitest-environment jsdom
//
// Component tests for the redesigned `/login` (TAN-331, mockup
// login-tosca-desktop / constitution 4.5.0): the email + password form is the
// main door from the first paint, "Masuk dengan SSO Telkom" is the secondary
// door below it, and the page never navigates on its own.

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
    </MockedProvider>,
  );
}

const EMAIL_LABEL = /email/i;
const PASSWORD_LABEL = /kata sandi/i;
const SSO_BUTTON = { name: "Masuk dengan SSO Telkom" };
const LOGIN_BUTTON = { name: "Masuk" };

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

/**
 * jsdom's `document.cookie` getter hides attributes (Max-Age), so capture the
 * raw cookie writes to assert session vs persistent persistence.
 */
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

describe("form email adalah pintu utama (TAN-331)", () => {
  it("shows the email + password form from the first paint and never navigates on mount", async () => {
    renderLogin([ssoStartMock(true, AUTHORIZATION_URL)]);

    expect(await screen.findByLabelText(EMAIL_LABEL)).toBeInTheDocument();
    expect(screen.getByLabelText(PASSWORD_LABEL)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Masuk" })).toBeInTheDocument();
    expect(locationAssign).not.toHaveBeenCalled();
    expect(routerReplace).not.toHaveBeenCalled();
  });

  it("offers the SSO Telkom button once the start answer is ready", async () => {
    renderLogin([ssoStartMock(true, AUTHORIZATION_URL)]);

    expect(await screen.findByRole("button", SSO_BUTTON)).toBeInTheDocument();
    // The authorization URL is ready, but the browser stays put until a click.
    await waitFor(() => expect(sessionStorage.getItem(ENTRA_ATTEMPT_KEY)).not.toBeNull());
    expect(locationAssign).not.toHaveBeenCalled();
  });

  it("hands the browser to SSO Telkom on click", async () => {
    renderLogin([ssoStartMock(true, AUTHORIZATION_URL)]);

    fireEvent.click(await screen.findByRole("button", SSO_BUTTON));

    expect(locationAssign).toHaveBeenCalledWith(AUTHORIZATION_URL);
    // The attempt must survive the navigation: the callback page reads it back.
    expect(sessionStorage.getItem(ENTRA_ATTEMPT_KEY)).not.toBeNull();
  });
});

describe("selagi opsi masuk SSO diperiksa (tanpa tombol nonaktif)", () => {
  it("shows a neutral placeholder instead of a disabled SSO button", async () => {
    // Staging feedback (TAN-287): a button that is disabled and then vanishes
    // when SSO turns out to be off reads as a glitch. While the answer is in
    // flight, show a status line and no door at all.
    renderLogin([ssoStartMock(true, AUTHORIZATION_URL)]);

    expect(screen.getByRole("status")).toHaveTextContent(/memeriksa opsi masuk/i);
    expect(screen.queryByRole("button", SSO_BUTTON)).not.toBeInTheDocument();

    expect(await screen.findByRole("button", SSO_BUTTON)).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});

describe("SSO tidak aktif atau gagal (tanpa tombol menggantung)", () => {
  it("shows only the email form when entraSsoStart answers enabled=false", async () => {
    renderLogin([ssoStartMock(false)]);

    expect(await screen.findByLabelText(EMAIL_LABEL)).toBeInTheDocument();
    expect(screen.queryByRole("button", SSO_BUTTON)).not.toBeInTheDocument();
    expect(locationAssign).not.toHaveBeenCalled();
  });

  it("keeps the email form and says so when the SSO query fails", async () => {
    renderLogin([
      {
        request: { query: EntraSsoStartDocument },
        variableMatcher: () => true,
        error: new Error("network"),
      },
    ]);

    expect(await screen.findByLabelText(EMAIL_LABEL)).toBeInTheDocument();
    expect(
      await screen.findByText(/masuk dengan sso telkom sedang tidak tersedia/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", SSO_BUTTON)).not.toBeInTheDocument();
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
    expect(await screen.findByRole("button", SSO_BUTTON)).toBeInTheDocument();
    expect(screen.getByLabelText(EMAIL_LABEL)).toBeInTheDocument();
    expect(locationAssign).not.toHaveBeenCalled();
  });

  it("names the Microsoft error code and points at the admin", async () => {
    params = new URLSearchParams("sso=cancelled&entra=access_denied");
    renderLogin([ssoStartMock(true, AUTHORIZATION_URL)]);

    expect(await screen.findByRole("alert")).toHaveTextContent(/access_denied/);
    expect(screen.getByRole("alert")).toHaveTextContent(/hubungi admin/i);
    expect(locationAssign).not.toHaveBeenCalled();
  });

  it("explains an error return and keeps the email form usable", async () => {
    params = new URLSearchParams("sso=error");
    renderLogin([ssoStartMock(true, AUTHORIZATION_URL)]);

    expect(await screen.findByRole("alert")).toHaveTextContent(/masuk dengan microsoft gagal/i);
    expect(screen.getByLabelText(EMAIL_LABEL)).toBeInTheDocument();
    expect(locationAssign).not.toHaveBeenCalled();
  });
});

describe("jalur email + kata sandi (FR-002 — tidak boleh teregresi)", () => {
  function loginMocks() {
    return [
      ssoStartMock(false),
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
    ];
  }

  async function fillAndSubmit(password = "secret") {
    fireEvent.change(await screen.findByLabelText(EMAIL_LABEL), {
      target: { value: "ada@tania.id" },
    });
    fireEvent.change(screen.getByLabelText(PASSWORD_LABEL), {
      target: { value: password },
    });
    fireEvent.click(screen.getByRole("button", LOGIN_BUTTON));
  }

  it("signs in and goes to the role landing (TAN-343)", async () => {
    const capture = captureCookieWrites();
    try {
      renderLogin(loginMocks());

      await fillAndSubmit();

      await waitFor(() => {
        expect(tokenStore.getSession()?.accessToken).toBe("token-abc");
        // TAN-343: Admin mendarat di Accounts, bukan dashboard.
        expect(routerReplace).toHaveBeenCalledWith("/accounts");
      });
      // Without "Ingat saya" the session cookie stays browser-scoped.
      expect(capture.writes.join(" ")).not.toContain("Max-Age=");
      expect(locationAssign).not.toHaveBeenCalled();
    } finally {
      capture.restore();
    }
  });

  it("writes a persistent cookie when Ingat saya is checked", async () => {
    const capture = captureCookieWrites();
    try {
      renderLogin(loginMocks());

      fireEvent.click(await screen.findByRole("checkbox", { name: /ingat saya/i }));
      await fillAndSubmit();

      await waitFor(() => {
        expect(tokenStore.getSession()?.accessToken).toBe("token-abc");
      });
      expect(capture.writes.join(" ")).toContain("Max-Age=2592000");
    } finally {
      capture.restore();
    }
  });

  it("shows an alert and keeps the session empty when the mutation fails", async () => {
    renderLogin([
      ssoStartMock(false),
      {
        request: {
          query: LoginDocument,
          variables: { input: { email: "ada@tania.id", password: "wrong" } },
        },
        error: new Error("FORBIDDEN"),
      },
    ]);

    await fillAndSubmit("wrong");

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("FORBIDDEN");
      expect(tokenStore.getSession()).toBeNull();
    });
  });
});
