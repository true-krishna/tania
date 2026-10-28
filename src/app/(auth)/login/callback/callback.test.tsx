// @vitest-environment jsdom
//
// Component tests for `/login/callback` (T027 · US1 AC1–AC3 · FR-003/FR-009 ·
// contracts/sso-entra.md §4/§8). The exchange may only run when the browser's
// own `state` matches; every failure must end in a readable Indonesian message.
// Since D8′ no browser hint is written or read here.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { ApolloError } from "@apollo/client";
import { LoginWithEntraDocument } from "@/generated/graphql";
import * as tokenStore from "@/lib/auth/token-store";
import { saveEntraAuthAttempt } from "@/features/auth/entra-pkce";
import CallbackView from "./CallbackView";

const routerReplace = vi.fn();
let params = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: routerReplace }),
  useSearchParams: () => params,
}));

const ATTEMPT = {
  codeVerifier: "verifier-abc",
  state: "state-xyz",
  nonce: "nonce-123",
};

const SESSION = {
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
};

function exchangeMock() {
  return {
    request: {
      query: LoginWithEntraDocument,
      variables: {
        input: { code: "code-1", codeVerifier: ATTEMPT.codeVerifier, nonce: ATTEMPT.nonce },
      },
    },
    result: { data: { loginWithEntra: SESSION } },
  };
}

function renderCallback(mocks: unknown[]) {
  return render(
    <MockedProvider mocks={mocks as never}>
      <CallbackView />
    </MockedProvider>
  );
}

/** The generic mapping rejection (contracts §4) — same message for every cause. */
function rejectedError(code = "UNAUTHENTICATED") {
  return new ApolloError({
    graphQLErrors: [
      {
        message:
          code === "UNAUTHENTICATED"
            ? "Akun korporat ini tidak terhubung ke akun Tania. Hubungi Admin."
            : "Layanan Microsoft sedang tidak tersedia. Coba lagi, atau masuk dengan email & kata sandi.",
        extensions: { code },
      },
    ],
  });
}

beforeEach(() => {
  params = new URLSearchParams();
  routerReplace.mockClear();
  sessionStorage.clear();
  localStorage.clear();
  tokenStore.clearSession();
});

describe("verifikasi state (tanpa memanggil backend)", () => {
  it("rejects a mismatched state and never forms a session", async () => {
    saveEntraAuthAttempt(ATTEMPT);
    params = new URLSearchParams("code=code-1&state=somebody-elses-state");
    renderCallback([exchangeMock()]);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /sesi masuk tidak valid atau sudah kedaluwarsa/i,
    );
    expect(tokenStore.getSession()).toBeNull();
    expect(routerReplace).not.toHaveBeenCalled();
  });

  it("rejects a response when the attempt is gone (already used or another tab)", async () => {
    params = new URLSearchParams("code=code-1&state=state-xyz");
    renderCallback([exchangeMock()]);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /sesi masuk tidak valid atau sudah kedaluwarsa/i,
    );
    expect(tokenStore.getSession()).toBeNull();
  });

  it("rejects a callback without parameters instead of showing an empty page", async () => {
    renderCallback([]);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /sesi masuk tidak valid atau sudah kedaluwarsa/i,
    );
    expect(screen.getByRole("link", { name: /kembali ke halaman masuk/i })).toBeInTheDocument();
  });

  it("consumes the attempt once, so a reload cannot replay it", async () => {
    saveEntraAuthAttempt(ATTEMPT);
    params = new URLSearchParams("code=code-1&state=state-xyz");
    renderCallback([exchangeMock()]);

    await waitFor(() => expect(tokenStore.getSession()?.accessToken).toBe("token-abc"));
    expect(sessionStorage.getItem("tania:sso:attempt")).toBeNull();
  });
});

describe("pertukaran kode berhasil", () => {
  it("forms the session and goes to the role landing (TAN-343)", async () => {
    saveEntraAuthAttempt(ATTEMPT);
    params = new URLSearchParams("code=code-1&state=state-xyz");
    renderCallback([exchangeMock()]);

    await waitFor(() => {
      expect(tokenStore.getSession()?.accessToken).toBe("token-abc");
      // TAN-343: Admin mendarat di Accounts, bukan dashboard.
      expect(routerReplace).toHaveBeenCalledWith("/accounts");
    });
  });
});

describe("penolakan & kegagalan", () => {
  it("shows the backend's Indonesian rejection verbatim", async () => {
    saveEntraAuthAttempt(ATTEMPT);
    params = new URLSearchParams("code=code-1&state=state-xyz");
    renderCallback([
      {
        request: {
          query: LoginWithEntraDocument,
          variables: {
            input: { code: "code-1", codeVerifier: ATTEMPT.codeVerifier, nonce: ATTEMPT.nonce },
          },
        },
        error: rejectedError(),
      },
    ]);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /akun korporat ini tidak terhubung ke akun tania\. hubungi admin\./i,
    );
    expect(tokenStore.getSession()).toBeNull();
    expect(routerReplace).not.toHaveBeenCalled();
  });

  it("distinguishes a transient Microsoft outage (the user should retry)", async () => {
    saveEntraAuthAttempt(ATTEMPT);
    params = new URLSearchParams("code=code-1&state=state-xyz");
    renderCallback([
      {
        request: {
          query: LoginWithEntraDocument,
          variables: {
            input: { code: "code-1", codeVerifier: ATTEMPT.codeVerifier, nonce: ATTEMPT.nonce },
          },
        },
        error: rejectedError("ENTRA_UNAVAILABLE"),
      },
    ]);

    expect(await screen.findByRole("alert")).toHaveTextContent(/layanan microsoft sedang tidak tersedia/i);
    expect(tokenStore.getSession()).toBeNull();
  });
});

describe("pembatalan di halaman Microsoft", () => {
  it("returns to /login with the cancellation message", async () => {
    params = new URLSearchParams("error=access_denied");
    renderCallback([]);

    // The Entra error code travels back with the visitor so the cause is
    // visible without the network log.
    await waitFor(() =>
      expect(routerReplace).toHaveBeenCalledWith("/login?sso=cancelled&entra=access_denied"),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
