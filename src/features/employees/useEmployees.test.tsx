// @vitest-environment jsdom

import * as React from "react";
import { describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import {
  ApolloClient,
  ApolloLink,
  ApolloProvider,
  InMemoryCache,
  Observable,
} from "@apollo/client";
import { useEmployees } from "./useEmployees";

type Page = {
  totalCount: number;
  ids: number[];
  hasNextPage: boolean;
  endCursor: string | null;
};

function employeeNode(i: number) {
  return {
    __typename: "Employee",
    id: `emp-${i}`,
    fullName: `Karyawan ${String(i).padStart(2, "0")}`,
    nikMasked: "************1234",
    email: `karyawan${i}@tania.id`,
    status: "ACTIVE",
    assignable: true,
    nomorInduk: `EMP-${i}`,
    unit: { __typename: "Unit", id: "u-1", name: "Digital" },
    jobRole: { __typename: "JobRole", id: "jr-1", name: "Engineer" },
  };
}

function conn(page: Page) {
  return {
    __typename: "EmployeeConnection",
    totalCount: page.totalCount,
    edges: page.ids.map((i) => ({
      __typename: "EmployeeEdge",
      cursor: `c-${i}`,
      node: employeeNode(i),
    })),
    pageInfo: { __typename: "PageInfo", hasNextPage: page.hasNextPage, endCursor: page.endCursor },
  };
}

function makeClient(routes: Record<string, Page>, counter: { count: number }, delay = 10) {
  const link = new ApolloLink(
    (operation) =>
      new Observable((observer) => {
        counter.count++;
        const after = (operation.variables.after as string | null) ?? "";
        const search = (operation.variables.filter as { search?: string } | null)?.search ?? "";
        const page = routes[`${search}|${after}`];
        const timer = setTimeout(() => {
          if (!page) {
            observer.error(new Error(`no mock route for search="${search}" after="${after}"`));
            return;
          }
          observer.next({ data: { employees: conn(page) } });
          observer.complete();
        }, delay);
        return () => clearTimeout(timer);
      }),
  );
  return new ApolloClient({
    link,
    cache: new InMemoryCache({
      typePolicies: {
        Query: { fields: { employees: { keyArgs: ["filter"] } } },
        EmployeeConnection: { merge: false },
      },
    }),
    devtools: { enabled: false },
  });
}

function ids(from: number, to: number) {
  return Array.from({ length: to - from + 1 }, (_, k) => from + k);
}

describe("useEmployees cursor accumulation", () => {
  it("accumulates fetchMore pages and stops at hasNextPage=false", async () => {
    const counter = { count: 0 };
    const client = makeClient(
      {
        "|": { totalCount: 147, ids: ids(1, 100), hasNextPage: true, endCursor: "C100" },
        "|C100": { totalCount: 147, ids: ids(101, 147), hasNextPage: false, endCursor: "C147" },
      },
      counter,
    );
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ApolloProvider client={client}>{children}</ApolloProvider>
    );

    const { result } = renderHook(() => useEmployees(), { wrapper });
    await waitFor(() => expect(result.current.employees).toHaveLength(100));
    expect(counter.count).toBe(1);
    expect(result.current.hasNextPage).toBe(true);

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.employees).toHaveLength(147));
    expect(counter.count).toBe(2);
    expect(result.current.hasNextPage).toBe(false);
    expect(result.current.stalled).toBe(false);
  });

  it("flags stalled when a fetchMore adds no rows, and stops retrying", async () => {
    const counter = { count: 0 };
    const client = makeClient(
      {
        "|": { totalCount: 147, ids: ids(1, 100), hasNextPage: true, endCursor: "C100" },
        // Server claims more but returns only rows already accumulated.
        "|C100": { totalCount: 147, ids: ids(1, 47), hasNextPage: true, endCursor: "C100" },
      },
      counter,
    );
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ApolloProvider client={client}>{children}</ApolloProvider>
    );

    const { result } = renderHook(() => useEmployees(), { wrapper });
    await waitFor(() => expect(result.current.employees).toHaveLength(100));

    act(() => result.current.loadMore());
    await waitFor(() => expect(counter.count).toBe(2));
    await waitFor(() => expect(result.current.stalled).toBe(true));
    expect(result.current.employees).toHaveLength(100);

    act(() => result.current.loadMore());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 60));
    });
    expect(counter.count).toBe(2);
  });

  it("reload refetches page 1 and clears the stall", async () => {
    const counter = { count: 0 };
    const client = makeClient(
      {
        "|": { totalCount: 147, ids: ids(1, 100), hasNextPage: true, endCursor: "C100" },
        "|C100": { totalCount: 147, ids: ids(1, 47), hasNextPage: true, endCursor: "C100" },
      },
      counter,
    );
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ApolloProvider client={client}>{children}</ApolloProvider>
    );

    const { result } = renderHook(() => useEmployees(), { wrapper });
    await waitFor(() => expect(result.current.employees).toHaveLength(100));
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.stalled).toBe(true));

    act(() => result.current.reload());
    await waitFor(() => expect(counter.count).toBe(3));
    await waitFor(() => expect(result.current.stalled).toBe(false));
    expect(result.current.employees).toHaveLength(100);
  });

  it("refetches from the network when variables return to a previous filter", async () => {
    const counter = { count: 0 };
    const client = makeClient(
      {
        "|": { totalCount: 147, ids: ids(1, 100), hasNextPage: false, endCursor: null },
        "a|": { totalCount: 2, ids: [3, 7], hasNextPage: false, endCursor: null },
      },
      counter,
    );
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ApolloProvider client={client}>{children}</ApolloProvider>
    );

    const { result, rerender } = renderHook(({ search }) => useEmployees({ search }, 100), {
      wrapper,
      initialProps: { search: undefined as string | undefined },
    });
    await waitFor(() => expect(result.current.employees).toHaveLength(100));
    expect(counter.count).toBe(1);

    rerender({ search: "a" });
    await waitFor(() => expect(result.current.employees).toHaveLength(2));
    expect(counter.count).toBe(2);

    rerender({ search: undefined });
    await waitFor(() => expect(counter.count).toBe(3));
    await waitFor(() => expect(result.current.employees).toHaveLength(100));
  });

  it("clears the stall when the filter changes", async () => {
    const counter = { count: 0 };
    const client = makeClient(
      {
        "|": { totalCount: 147, ids: ids(1, 100), hasNextPage: true, endCursor: "C100" },
        "|C100": { totalCount: 147, ids: ids(1, 47), hasNextPage: true, endCursor: "C100" },
        "x|": { totalCount: 1, ids: [9], hasNextPage: false, endCursor: null },
      },
      counter,
    );
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ApolloProvider client={client}>{children}</ApolloProvider>
    );

    const { result, rerender } = renderHook(({ search }) => useEmployees({ search }, 100), {
      wrapper,
      initialProps: { search: undefined as string | undefined },
    });
    await waitFor(() => expect(result.current.employees).toHaveLength(100));
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.stalled).toBe(true));

    rerender({ search: "x" });
    await waitFor(() => expect(result.current.employees).toHaveLength(1));
    expect(result.current.stalled).toBe(false);
  });
});
