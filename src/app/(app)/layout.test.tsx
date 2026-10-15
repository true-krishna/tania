// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import * as tokenStore from "@/lib/auth/token-store";
import { notifySessionExpired } from "@/lib/auth/session-expiry";
import AppLayout from "./layout";

// Guard peran asisten diuji di sisi shell (T027); panel/bubble sendiri diuji di
// src/features/assistant/assistant.test.tsx.
vi.mock("@/features/assistant/AssistantBubble", () => ({
  AssistantBubble: () => <button type="button">Asisten data</button>,
}));

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/dashboard",
}));

vi.mock("@apollo/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@apollo/client")>();
  return { ...actual, useMutation: () => [vi.fn()] };
});

const SESSION = {
  accessToken: "token-abc",
  accessTokenExpiresAt: "2026-01-01T00:00:00Z",
  refreshToken: "refresh-1",
  refreshTokenExpiresAt: "2099-01-01T00:00:00Z",
  accessRole: "ADMIN" as const,
  fullName: "Ada Lovelace",
  email: "ada@tania.id",
};

beforeEach(() => {
  process.env.NEXT_PUBLIC_AUTH_LOCAL_ONLY = "0";
  delete process.env.NEXT_PUBLIC_DEFAULT_ACCESS_ROLE;
  replace.mockClear();
  tokenStore.clearSession();
});

afterEach(() => {
  tokenStore.clearSession();
  vi.unstubAllEnvs();
});

describe("AppLayout session expiry redirect", () => {
  it("routes to /login when the session expires while the app is open", () => {
    tokenStore.setSession(SESSION);
    render(<AppLayout><main>konten</main></AppLayout>);

    notifySessionExpired();

    expect(replace).toHaveBeenCalledWith("/login");
  });

  it("does not route in local-only mode", () => {
    process.env.NEXT_PUBLIC_AUTH_LOCAL_ONLY = "1";
    tokenStore.setSession(SESSION);
    render(<AppLayout><main>konten</main></AppLayout>);

    notifySessionExpired();

    expect(replace).not.toHaveBeenCalled();
  });
});

describe("AppLayout asisten data (FR-01)", () => {
  it("menampilkan bubble asisten untuk CHAPTER", () => {
    tokenStore.setSession({ ...SESSION, accessRole: "CHAPTER" });
    render(<AppLayout><main>konten</main></AppLayout>);

    expect(screen.getByRole("button", { name: "Asisten data" })).toBeInTheDocument();
  });

  it("tidak menampilkan bubble asisten untuk ADMIN", () => {
    tokenStore.setSession(SESSION);
    render(<AppLayout><main>konten</main></AppLayout>);

    expect(screen.queryByRole("button", { name: "Asisten data" })).toBeNull();
  });
});
