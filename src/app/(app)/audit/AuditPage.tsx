"use client";

import * as React from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { Table } from "@/components/Table";
import { PageHeader } from "@/components/PageHeader";
import { useTablePagination } from "@/components/Pagination";
import { TableFilterBar } from "@/components/TableFilterBar";
import { useSessionRole } from "@/lib/auth/guard";
import { roleLabel } from "@/features/accounts/roles";
import { useAuditLogs } from "@/features/audit/useAuditLogs";
import {
  ACTION_LABEL,
  ACTION_PILL,
  ENTITY_LABEL,
  entityLabel,
} from "@/features/audit/actionLabels";
import type { AccessRole, AuditAction, AuditLogFilter } from "@/generated/graphql/types";
import { orDash } from "@/lib/cell";

const ROLE_LABEL: Record<AccessRole, string> = roleLabel;

export default function AuditPage() {
  const role = useSessionRole();
  if (role !== "ADMIN") {
    return (
      <section className="flex flex-col gap-4">
        <PageHeader
          subtitle="Jejak audit hanya dapat diakses oleh peran Admin (FR-17)."
          title="Jejak Audit"
        />
      </section>
    );
  }
  return <AuditViewer />;
}

function AuditViewer() {
  const [filters, setFilters] = React.useState<{ action: string; entityType: string }>({
    action: "",
    entityType: "",
  });
  const filter: AuditLogFilter = {
    action: (filters.action || undefined) as AuditAction | undefined,
    entityType: filters.entityType || undefined,
  };
  const { status, logs, totalCount, hasNextPage, loadingMore, error, loadMore } =
    useAuditLogs(filter);
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
        subtitle={`Mutasi & aktivitas sistem (${totalCount} catatan).`}
        title="Jejak Audit"
      />

      <TableFilterBar
        fields={[
          {
            key: "action",
            label: "Aksi",
            options: [
              { value: "", label: "Semua" },
              ...(Object.keys(ACTION_LABEL) as AuditAction[]).map((value) => ({
                value,
                label: ACTION_LABEL[value],
              })),
            ],
            type: "select",
          },
          {
            key: "entityType",
            label: "Entitas",
            options: [
              { value: "", label: "Semua" },
              ...Object.entries(ENTITY_LABEL).map(([value, label]) => ({ value, label })),
            ],
            type: "select",
          },
        ]}
        onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
        values={filters}
      />

      {logs && logs.length ? (
        <Table
          caption="Jejak audit"
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
          dataSource={pageRows}
          pagination={pagination}
          rowKey={(log) => log.id}
        />
      ) : (
        <EmptyState
          message={
            filters.action || filters.entityType
              ? "Tidak ada catatan audit yang cocok dengan filter."
              : "Belum ada catatan audit."
          }
        />
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
