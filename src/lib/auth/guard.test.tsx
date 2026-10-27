// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthGuard } from "./guard";
import type { Session } from "./session-codec";

const state = vi.hoisted(() => ({
  replace: vi.fn(),
  stored: null as Session | null,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: state.replace }),
}));

vi.mock("@/lib/auth/session-store", () => ({
  useSession: () => null,
  useSessionRole: () => null,
}));

vi.mock("@/lib/auth/token-store", () => ({
  getSession: () => state.stored,
}));

const SESSION: Session = {
  accessToken: "token-abc",
  accessTokenExpiresAt: "2026-10-02T00:00:00Z",
  refreshToken: "refresh-abc",
  refreshTokenExpiresAt: "2099-10-09T00:00:00Z",
  accessRole: "ADMIN",
  roleName: "ADMIN",
};

beforeEach(() => {
  state.replace.mockReset();
  state.stored = null;
  process.env.NEXT_PUBLIC_AUTH_LOCAL_ONLY = "0";
});

describe("AuthGuard session redirect", () => {
  it("does not sign out while the reactive snapshot is still hydrating and the cookie is valid", () => {
    state.stored = SESSION;
    render(
      <AuthGuard>
        <span>aplikasi</span>
      </AuthGuard>,
    );

    expect(state.replace).not.toHaveBeenCalled();
    expect(screen.getByText("aplikasi")).toBeInTheDocument();
  });

  it("redirects to login when there is no readable session cookie", () => {
    render(
      <AuthGuard>
        <span>aplikasi</span>
      </AuthGuard>,
    );

    expect(state.replace).toHaveBeenCalledWith("/login");
  });

  it("redirects when the stored refresh token is already expired", () => {
    state.stored = { ...SESSION, refreshTokenExpiresAt: "2020-01-01T00:00:00Z" };
    render(
      <AuthGuard>
        <span>aplikasi</span>
      </AuthGuard>,
    );

    expect(state.replace).toHaveBeenCalledWith("/login");
  });
});
