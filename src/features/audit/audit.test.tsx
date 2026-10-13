// @vitest-environment jsdom

import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import AuditPage from "@/app/(app)/audit/page";
import { AuditLogsDocument } from "@/generated/graphql";

let mockRole = "ADMIN";
vi.mock("@/lib/auth/guard", () => ({
  useSessionRole: () => mockRole,
}));

function logEdge(i: number) {
  return {
    __typename: "AuditLogEdge",
    cursor: `c-${i}`,
    node: {
      __typename: "AuditLog",
      id: `log-${i}`,
      occurredAt: "2025-08-01T09:00:00Z",
      action: i === 1 ? "CREATE" : "UPDATE",
      actor: { __typename: "User", id: `u-${i}`, fullName: `Aktor ${i}` },
      actorRole: "ADMIN",
      entityType: "Employee",
      entityId: `emp-${i}`,
      before: null,
      after: i === 1 ? '{"status":"ACTIVE"}' : null,
      ip: "127.0.0.1",
      requestId: i === 1 ? "req-1" : null,
      userAgent: null,
    },
  };
}

const auditLogs = {
  __typename: "AuditLogConnection",
  totalCount: 1,
  edges: [logEdge(1)],
  pageInfo: { __typename: "PageInfo", hasNextPage: false, endCursor: "c1" },
};

describe("AuditPage — Admin (FR-17)", () => {
  it("renders audit rows in a table for an Admin", async () => {
    render(
      <MockedProvider
        mocks={[
          {
            request: { query: AuditLogsDocument, variables: { filter: {}, first: 25, after: null } },
            result: { data: { auditLogs } },
          },
        ]}
      >
        <AuditPage />
      </MockedProvider>
    );

    expect(await screen.findByText(/1 catatan/)).toBeInTheDocument();
    expect(screen.getByText("Buat")).toBeInTheDocument();
    expect(screen.getByText(/Employee · emp-1/)).toBeInTheDocument();
    expect(screen.getByText("Aktor 1")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("127.0.0.1")).toBeInTheDocument();
    expect(screen.getByText("req-1")).toBeInTheDocument();
    expect(screen.getByText(/Sesudah: \{"status":"ACTIVE"\}/)).toBeInTheDocument();
    expect(screen.getByText("Menampilkan 1–1 dari 1")).toBeInTheDocument();
  });

  it("moves between table pages with the pagination controls", async () => {
    const twelveLogs = {
      __typename: "AuditLogConnection",
      totalCount: 12,
      edges: Array.from({ length: 12 }, (_, i) => logEdge(i + 1)),
      pageInfo: { __typename: "PageInfo", hasNextPage: false, endCursor: "c-12" },
    };
    render(
      <MockedProvider
        mocks={[
          {
            request: { query: AuditLogsDocument, variables: { filter: {}, first: 25, after: null } },
            result: { data: { auditLogs: twelveLogs } },
          },
        ]}
      >
        <AuditPage />
      </MockedProvider>
    );

    expect(await screen.findByText("Aktor 1")).toBeInTheDocument();
    expect(screen.queryByText("Aktor 11")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Halaman 2" }));

    expect(await screen.findByText("Aktor 11")).toBeInTheDocument();
    expect(screen.queryByText("Aktor 1")).not.toBeInTheDocument();
    expect(screen.getByText("Menampilkan 11–12 dari 12")).toBeInTheDocument();
  });

  it("shows an access note for a non-Admin role", async () => {
    mockRole = "CHAPTER";
    render(
      <MockedProvider mocks={[]}>
        <AuditPage />
      </MockedProvider>
    );

    expect(await screen.findByText(/hanya dapat diakses oleh peran Admin/i)).toBeInTheDocument();
  });
});