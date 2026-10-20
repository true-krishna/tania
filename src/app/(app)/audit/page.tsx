"use client";

import * as React from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { Table } from "@/components/Table";
import { PageHeader } from "@/components/PageHeader";
import { useTablePagination } from "@/components/Pagination";
import { useSessionRole } from "@/lib/auth/guard";
import { roleLabel } from "@/features/accounts/roles";
import { useAuditLogs } from "@/features/audit/useAuditLogs";
import { ACTION_LABEL, ACTION_PILL, entityLabel } from "@/features/audit/actionLabels";
import type { AccessRole } from "@/generated/graphql/types";
import { orDash } from "@/lib/cell";

const ROLE_LABEL: Record<AccessRole, string> = roleLabel;

/**
 * Admin audit trail viewer (FR-17) — US5.
 * Cursor pagination over `auditLogs` (connection). Admin-only route (FR-17);
 * auth enforced server-side (FR-16), this gates the view at the UI layer.
 */
export default function AuditPage() {
  const role = useSessionRole();
  if (role !== "ADMIN") {
    return (
      <section className="flex flex-col gap-4">
        <PageHeader
          title="Jejak Audit"
          subtitle="Jejak audit hanya dapat diakses oleh peran Admin (FR-17)."
        />
      </section>
    );
  }
  return <AuditViewer />;
}

function AuditViewer() {
  const { status, logs, totalCount, hasNextPage, loadingMore, error, loadMore } = useAuditLogs();
  const { pageRows, pagination } = useTablePagination(logs, {
    totalItems: totalCount,
    hasMore: hasNextPage,
    loadingMore,
    loadMore,
  });

  if (status === "loading") return <LoadingState label="Memuat jejak audit…" />;
  if (status === "error") return <ErrorState message={error ?? "Gagal memuat jejak audit."} />;

  return (
    <section className="flex flex-col gap-4">
      <PageHeader
        title="Jejak Audit"
        subtitle={`Mutasi & aktivitas sistem (${totalCount} catatan).`}
      />

      {logs && logs.length ? (
        <Table
          caption="Jejak audit"
          rowKey={(log) => log.id}
          dataSource={pageRows}
          pagination={pagination}
          columns={[
            {
              key: "waktu",
              title: "Waktu",
              className: "text-xs whitespace-nowrap text-zinc-500",
              render: (_value, log) => formatTime(log.occurredAt),
            },
            {
              key: "aksi",
              title: "Aksi",
              render: (_value, log) => (
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${ACTION_PILL[log.action]}`}
                >
                  {ACTION_LABEL[log.action]}
                </span>
              ),
            },
            {
              key: "entitas",
              title: "Entitas",
              className: "font-medium text-zinc-900",
              render: (_value, log) => (
                <>
                  {entityLabel(log.entityType)}
                  {log.entityId ? ` · ${log.entityId}` : ""}
                </>
              ),
            },
            {
              key: "aktor",
              title: "Aktor",
              className: "text-zinc-600",
              render: (_value, log) => (
                <>
                  {orDash(log.actor?.fullName)}
                  <span className="block text-xs text-zinc-500">
                    {orDash(log.actorRole ? ROLE_LABEL[log.actorRole] : null)}
                  </span>
                </>
              ),
            },
            {
              key: "konteks",
              title: "IP / Request",
              className: "text-xs text-zinc-500",
              render: (_value, log) => (
                <>
                  {orDash(log.ip)}
                  {log.requestId ? (
                    <code className="block max-w-[160px] truncate" title={log.requestId}>
                      {log.requestId}
                    </code>
                  ) : null}
                </>
              ),
            },
            {
              key: "perubahan",
              title: "Perubahan",
              className: "font-mono text-xs text-zinc-600",
              render: (_value, log) => (
                <>
                  {log.before ? (
                    <span className="block max-w-[220px] truncate" title={log.before}>
                      Sebelum: {log.before}
                    </span>
                  ) : null}
                  {log.after ? (
                    <span className="block max-w-[220px] truncate" title={log.after}>
                      Sesudah: {log.after}
                    </span>
                  ) : null}
                  {!log.before && !log.after ? "-" : null}
                </>
              ),
            },
          ]}
        />
      ) : (
        <EmptyState message="Belum ada catatan audit." />
      )}
    </section>
  );
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
