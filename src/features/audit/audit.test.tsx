// @vitest-environment jsdom

import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import AuditPage from "@/app/(app)/audit/page";
import { AuditLogsDocument } from "@/generated/graphql";

let mockRole = "ADMIN";
vi.mock("@/lib/auth/guard", () => ({
  useSessionRole: () => mockRole,
}));

const auditLogs = {
  __typename: "AuditLogConnection",
  totalCount: 1,
  edges: [
    {
      __typename: "AuditLogEdge",
      cursor: "c1",
      node: {
        __typename: "AuditLog",
        id: "log-1",
        occurredAt: "2025-08-01T09:00:00Z",
        action: "CREATE",
        actor: { __typename: "User", id: "u-1", fullName: "Admin Satu" },
        actorRole: "ADMIN",
        entityType: "Employee",
        entityId: "emp-1",
        before: null,
        after: '{"status":"ACTIVE"}',
        ip: "127.0.0.1",
        requestId: "req-1",
        userAgent: null,
      },
    },
  ],
  pageInfo: { __typename: "PageInfo", hasNextPage: false, endCursor: "c1" },
};

describe("AuditPage — Admin (FR-17)", () => {
  it("renders audit rows for an Admin", async () => {
    mockRole = "ADMIN";
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
    expect(screen.getByText(/Admin Satu · Admin/)).toBeInTheDocument();
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