// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { LoginDocument } from "@/generated/graphql";
import * as tokenStore from "@/lib/auth/token-store";
import LoginForm from "./LoginForm";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

const loginResult = {
  data: {
    login: {
      accessToken: "token-abc",
      accessTokenExpiresAt: "2026-10-02T00:00:00Z",
      user: {
        id: "u-1",
        email: "ada@tania.id",
        fullName: "Ada Lovelace",
        accessRole: "ADMIN",
        status: "ACTIVE",
      },
    },
  },
} as const;

// AUTH_LOCAL_ONLY off: configuration dibaca dari process.env; pastikan mati.
beforeEach(() => {
  process.env.NEXT_PUBLIC_AUTH_LOCAL_ONLY = "0";
  delete process.env.NEXT_PUBLIC_DEFAULT_ACCESS_ROLE;
  replace.mockClear();
  tokenStore.clearSession();
});

describe("LoginForm", () => {
  it("menyimpan sesi dan mengarahkan ke dashboard setelah login sukses", async () => {
    render(
      <MockedProvider
        mocks={[
          {
            request: {
              query: LoginDocument,
              variables: {
                input: { email: "ada@tania.id", password: "secret" },
              },
            },
            result: loginResult,
          },
        ]}
      >
        <LoginForm />
      </MockedProvider>
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "ada@tania.id" },
    });
    fireEvent.change(screen.getByLabelText(/kata sandi/i), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: /masuk/i }));

    await waitFor(() => {
      const session = tokenStore.getSession();
      expect(session?.accessToken).toBe("token-abc");
      expect(session?.accessRole).toBe("ADMIN");
      expect(replace).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("menampilkan pesan kesalahan saat mutation gagal", async () => {
    render(
      <MockedProvider
        mocks={[
          {
            request: {
              query: LoginDocument,
              variables: {
                input: { email: "ada@tania.id", password: "wrong" },
              },
            },
            error: new Error("FORBIDDEN"),
          },
        ]}
      >
        <LoginForm />
      </MockedProvider>
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "ada@tania.id" },
    });
    fireEvent.change(screen.getByLabelText(/kata sandi/i), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: /masuk/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("FORBIDDEN");
      expect(tokenStore.getSession()).toBeNull();
    });
  });
});