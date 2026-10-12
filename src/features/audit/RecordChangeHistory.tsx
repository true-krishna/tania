"use client";

import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { ACTION_LABEL, ACTION_PILL } from "@/features/audit/actionLabels";
import { useAuditLogs } from "@/features/audit/useAuditLogs";

type RecordChangeHistoryProps = {
  entityType: "employee" | "employment_contract";
  entityId: string;
};

/**
 * Per-record change history for Operation (FR-41) — reads `auditLogs` scoped to
 * one entity. Full audit remains Admin-only; this panel shows only the
 * before/after trail of the record being viewed.
 */
export function RecordChangeHistory({ entityType, entityId }: RecordChangeHistoryProps) {
  const { status, logs, error, hasNextPage, loadingMore, loadMore } = useAuditLogs({
    entityType,
    entityId,
  });

  if (status === "loading") return <LoadingState label="Memuat riwayat perubahan…" />;
  if (status === "error")
    return <ErrorState message={error ?? "Gagal memuat riwayat perubahan."} />;

  if (!logs || logs.length === 0) {
    return <EmptyState message="Belum ada perubahan tercatat untuk record ini." />;
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {logs.map((log) => (
          <li key={log.id} className="rounded-md border border-board-border bg-white px-3 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${ACTION_PILL[log.action]}`}
              >
                {ACTION_LABEL[log.action]}
              </span>
              <span className="text-xs text-zinc-500">{formatTime(log.occurredAt)}</span>
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              <span>{log.actor?.fullName ?? "—"}</span>
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
        <button
          type="button"
          onClick={loadMore}
          disabled={loadingMore}
          className="w-fit rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
        >
          {loadingMore ? "Memuat…" : "Muat lebih banyak"}
        </button>
      ) : null}
    </div>
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
