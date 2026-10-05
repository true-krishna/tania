"use client";

import * as React from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { useSessionRole } from "@/lib/auth/guard";
import { roleLabel } from "@/features/accounts/roles";
import { useAuditLogs } from "@/features/audit/useAuditLogs";
import type { AuditAction, AccessRole } from "@/generated/graphql/types";

const ACTION_LABEL: Record<AuditAction, string> = {
  CREATE: "Buat",
  UPDATE: "Ubah",
  DEACTIVATE: "Nonaktifkan",
  DELETE: "Hapus",
  LOGIN: "Login",
  LOGOUT: "Logout",
};

const ROLE_LABEL: Record<AccessRole, string> = roleLabel;

const ACTION_PILL: Record<AuditAction, string> = {
  CREATE: "bg-green-100 text-green-700",
  UPDATE: "bg-brand-100 text-brand-700",
  DEACTIVATE: "bg-amber-100 text-amber-700",
  DELETE: "bg-red-100 text-red-700",
  LOGIN: "bg-zinc-100 text-zinc-700",
  LOGOUT: "bg-zinc-100 text-zinc-700",
};

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

  if (status === "loading") return <LoadingState label="Memuat jejak audit…" />;
  if (status === "error") return <ErrorState message={error ?? "Gagal memuat jejak audit."} />;

  return (
    <section className="flex flex-col gap-4">
      <PageHeader
        title="Jejak Audit"
        subtitle={`Mutasi & aktivitas sistem (${totalCount} catatan).`}
      />

      {logs && logs.length ? (
        <Card className="flex flex-col gap-3">
          <ul className="flex flex-col gap-2">
            {logs.map((log) => (
              <li key={log.id} className="rounded-md border border-surface-border px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${ACTION_PILL[log.action]}`}
                    >
                      {ACTION_LABEL[log.action]}
                    </span>
                    <span className="font-medium text-zinc-900">
                      {log.entityType}
                      {log.entityId ? ` · ${log.entityId}` : ""}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500">{formatTime(log.occurredAt)}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                  <span>
                    {log.actor?.fullName ?? "—"} ·{" "}
                    {log.actorRole ? ROLE_LABEL[log.actorRole] : "—"}
                  </span>
                  {log.ip ? <span>IP {log.ip}</span> : null}
                  {log.requestId ? <code>{log.requestId}</code> : null}
                </div>
                {log.before || log.after ? (
                  <div className="mt-1 flex flex-col gap-1 font-mono text-xs text-zinc-600">
                    {log.before ? <span>Sebelum: {log.before}</span> : null}
                    {log.after ? <span>Sesudah: {log.after}</span> : null}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>

          {hasNextPage ? (
            <Button variant="secondary" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? "Memuat…" : "Muat lebih banyak"}
            </Button>
          ) : (
            <p className="text-xs text-zinc-400">Tidak ada lagi catatan.</p>
          )}
        </Card>
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