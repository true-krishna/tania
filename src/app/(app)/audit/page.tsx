"use client";

import * as React from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { BoardTable, type Column } from "@/components/BoardTable";
import { PageHeader } from "@/components/PageHeader";
import { Pagination, useTablePagination } from "@/components/Pagination";
import { useSessionRole } from "@/lib/auth/guard";
import { roleLabel } from "@/features/accounts/roles";
import { useAuditLogs } from "@/features/audit/useAuditLogs";
import { ACTION_LABEL, ACTION_PILL } from "@/features/audit/actionLabels";
import type { AuditLogsQuery } from "@/generated/graphql";
import type { AccessRole } from "@/generated/graphql/types";
import { orDash } from "@/lib/cell";

const ROLE_LABEL: Record<AccessRole, string> = roleLabel;

type AuditLogNode = AuditLogsQuery["auditLogs"]["edges"][number]["node"];

const COLUMNS: Column[] = [
  { key: "waktu", label: "Waktu" },
  { key: "aksi", label: "Aksi" },
  { key: "entitas", label: "Entitas" },
  { key: "aktor", label: "Aktor" },
  { key: "konteks", label: "IP / Request" },
  { key: "perubahan", label: "Perubahan" },
];

function AuditRow({ log }: { log: AuditLogNode }) {
  return (
    <tr className="border-b border-board-border transition-colors hover:bg-zinc-50">
      <td className="px-4 py-2.5 text-xs whitespace-nowrap text-zinc-500">
        {formatTime(log.occurredAt)}
      </td>
      <td className="px-4 py-2.5">
        <span
          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${ACTION_PILL[log.action]}`}
        >
          {ACTION_LABEL[log.action]}
        </span>
      </td>
      <td className="px-4 py-2.5 font-medium text-zinc-900">
        {log.entityType}
        {log.entityId ? ` · ${log.entityId}` : ""}
      </td>
      <td className="px-4 py-2.5 text-zinc-600">
        {orDash(log.actor?.fullName)}
        <span className="block text-xs text-zinc-500">
          {orDash(log.actorRole ? ROLE_LABEL[log.actorRole] : null)}
        </span>
      </td>
      <td className="px-4 py-2.5 text-xs text-zinc-500">
        {orDash(log.ip)}
        {log.requestId ? (
          <code className="block max-w-[160px] truncate" title={log.requestId}>
            {log.requestId}
          </code>
        ) : null}
      </td>
      <td className="px-4 py-2.5 font-mono text-xs text-zinc-600">
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
      </td>
    </tr>
  );
}

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
        <>
          <BoardTable caption="Jejak audit" columns={COLUMNS} footer={<Pagination {...pagination} />}>
            {pageRows.map((log) => (
              <AuditRow key={log.id} log={log} />
            ))}
          </BoardTable>
        </>
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