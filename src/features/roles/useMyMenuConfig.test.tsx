// @vitest-environment jsdom

// Live-refresh contract (TAN-375): a failed grid degrades to the role defaults,
// and focus/route changes refetch once so an Admin's config edit reaches an
// already-open session without a reload.

import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import {
  ApolloClient,
  ApolloLink,
  ApolloProvider,
  InMemoryCache,
  Observable,
} from "@apollo/client";
import * as tokenStore from "@/lib/auth/token-store";
import { DEFAULT_MENU_ACCESS } from "@/lib/auth/menuAccess";
import { useMyMenuConfig } from "./useRoles";

const navigation = vi.hoisted(() => ({ pathname: "/dashboard" }));
vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname }));

const SESSION = {
  accessToken: "token-abc",
  accessTokenExpiresAt: "2026-01-01T00:00:00Z",
  refreshToken: "refresh-1",
  refreshTokenExpiresAt: "2099-01-01T00:00:00Z",
  accessRole: "ADMIN" as const,
  roleName: "ADMIN",
  fullName: "Ada Lovelace",
  email: "ada@tania.id",
};

const ADMIN_DASHBOARD = [
  {
    __typename: "RoleMenuEntry" as const,
    roleId: "role-admin",
    roleName: "ADMIN",
    menuEntryId: "dashboard",
    visible: true,
    accessLevel: "READ" as const,
  },
];

function makeClient(respond: (call: number) => { error?: Error; cells?: unknown[] }) {
  let calls = 0;
  const link = new ApolloLink(
    () =>
      new Observable((observer) => {
        calls += 1;
        const next = respond(calls);
        if (next.error) {
          observer.error(next.error);
          return;
        }
        observer.next({ data: { myMenuConfig: next.cells ?? [] } });
        observer.complete();
      }),
  );
  const client = new ApolloClient({
    link,
    cache: new InMemoryCache(),
    devtools: { enabled: false },
  });
  return { client, calls: () => calls };
}

function wrapperFor(client: ApolloClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <ApolloProvider client={client}>{children}</ApolloProvider>;
  };
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_AUTH_LOCAL_ONLY = "0";
  navigation.pathname = "/dashboard";
  tokenStore.setSession(SESSION);
});

afterEach(() => {
  tokenStore.clearSession();
  vi.unstubAllEnvs();
});

describe("useMyMenuConfig saat kueri gagal", () => {
  it("memakai grid default peran dan tetap menandai status error", async () => {
    const { client } = makeClient(() => ({ error: new Error("jaringan") }));

    const { result } = renderHook(() => useMyMenuConfig(), {
      wrapper: wrapperFor(client),
    });

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.roleName).toBe("ADMIN");
    expect(result.current.config).toEqual({ ADMIN: DEFAULT_MENU_ACCESS.ADMIN });
    expect(result.current.error).toContain("jaringan");
  });
});

describe("useMyMenuConfig revalidasi", () => {
  it("mengambil ulang sekali saat fokus dan memakai grid baru", async () => {
    const { client, calls } = makeClient((call) =>
      call === 1 ? { error: new Error("jaringan") } : { cells: ADMIN_DASHBOARD },
    );

    const { result } = renderHook(() => useMyMenuConfig(), {
      wrapper: wrapperFor(client),
    });
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(calls()).toBe(1);

    act(() => {
      window.dispatchEvent(new Event("focus"));
      window.dispatchEvent(new Event("focus"));
    });

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(calls()).toBe(2);
    expect(result.current.config).toEqual({
      ADMIN: { dashboard: { visible: true, accessLevel: "READ" } },
    });
  });

  it("mengambil ulang saat rute berubah", async () => {
    const { client, calls } = makeClient(() => ({ cells: ADMIN_DASHBOARD }));

    const { result, rerender } = renderHook(() => useMyMenuConfig(), {
      wrapper: wrapperFor(client),
    });
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(calls()).toBe(1);

    navigation.pathname = "/employees";
    rerender();

    await waitFor(() => expect(calls()).toBe(2));
  });
});
