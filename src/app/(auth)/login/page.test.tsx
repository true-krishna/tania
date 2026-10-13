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
} as const;

// AUTH_LOCAL_ONLY off: config reads process.env; ensure it is off.
beforeEach(() => {
  process.env.NEXT_PUBLIC_AUTH_LOCAL_ONLY = "0";
  delete process.env.NEXT_PUBLIC_DEFAULT_ACCESS_ROLE;
  replace.mockClear();
  tokenStore.clearSession();
});

describe("LoginForm", () => {
  it("saves the session and redirects to the dashboard after a successful login", async () => {
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
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: /masuk ke workspace/i }));

    await waitFor(() => {
      const session = tokenStore.getSession();
      expect(session?.accessToken).toBe("token-abc");
      expect(session?.accessRole).toBe("ADMIN");
      expect(replace).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows an error message when the mutation fails", async () => {
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
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: /masuk ke workspace/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("FORBIDDEN");
      expect(tokenStore.getSession()).toBeNull();
    });
  });

  it("renders the form and the revised brand copy", () => {
    render(
      <MockedProvider mocks={[]}>
        <LoginForm />
      </MockedProvider>
    );

    expect(
      screen.getByRole("heading", { name: /masuk ke tania/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /masuk ke workspace/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/talent management platform/i)).toBeInTheDocument();
    expect(screen.queryByText(/invite tania/i)).not.toBeInTheDocument();
  });
});
