"use client";

import * as React from "react";
import { BoardTable } from "@/components/BoardTable";
import { Button } from "@/components/Button";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { ACTIVITY_TYPE_LABEL } from "./mocks";
import { ActivityStatusBadge } from "./ActivityStatusBadge";
import type { PersonalWorkActivity } from "./types";

export interface ActivityListProps {
  status: "loading" | "ready" | "error";
  activities: PersonalWorkActivity[] | undefined;
  error: string | null;
  currentTalentId: string;
  busy?: boolean;
  onEdit: (activity: PersonalWorkActivity) => void;
  onDelete: (activity: PersonalWorkActivity) => void;
  onRetry?: () => void;
}

/**
 * Own-activity list with loading / empty / error / success states.
 *
 * Edit and delete are offered on owned rows only; ownership is enforced
 * server-side regardless — this is UX, not a security boundary (SC-002).
 */
export function ActivityList({
  status,
  activities,
  error,
  currentTalentId,
  busy = false,
  onEdit,
  onDelete,
  onRetry,
}: ActivityListProps) {
  if (status === "loading") return <LoadingState label="Memuat aktivitas…" />;

  if (status === "error") {
    return (
      <div className="flex flex-col items-start gap-3">
        <ErrorState message={error ?? "Gagal memuat aktivitas."} />
        {onRetry ? (
          <Button type="button" variant="secondary" onClick={onRetry}>
            Coba lagi
          </Button>
        ) : null}
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return <EmptyState message="Belum ada aktivitas yang cocok dengan filter." />;
  }

  return (
    <BoardTable
      caption="Daftar aktivitas saya"
      columns={[
        { key: "title", label: "Aktivitas" },
        { key: "type", label: "Jenis" },
        { key: "period", label: "Periode" },
        { key: "project", label: "Project" },
        { key: "priority", label: "Prioritas" },
        { key: "status", label: "Status" },
        { key: "actions", label: "Aksi", className: "text-right" },
      ]}
    >
      {activities.map((activity) => {
        const owned = activity.talentId === currentTalentId;
        return (
          <tr
            key={activity.id}
            className="border-b border-board-border transition-colors hover:bg-zinc-50"
          >
            <td className="px-4 py-2.5 font-medium text-zinc-900">{activity.title}</td>
            <td className="px-4 py-2.5 text-zinc-600">
              {ACTIVITY_TYPE_LABEL[activity.activityType]}
            </td>
            <td className="px-4 py-2.5 text-zinc-600">
              {activity.startDate} — {activity.endDate ?? "sekarang"}
            </td>
            <td className="px-4 py-2.5 text-zinc-600">{activity.project?.name ?? "—"}</td>
            <td className="px-4 py-2.5 text-zinc-600">{activity.priority.name}</td>
            <td className="px-4 py-2.5">
              <ActivityStatusBadge status={activity.status} />
            </td>
            <td className="px-4 py-2.5">
              {owned ? (
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => onEdit(activity)}
                    disabled={busy}
                    aria-label={`Ubah ${activity.title}`}
                  >
                    Ubah
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onDelete(activity)}
                    disabled={busy}
                    aria-label={`Hapus ${activity.title}`}
                  >
                    Hapus
                  </Button>
                </div>
              ) : (
                <span className="block text-right text-xs text-zinc-400">Bukan milik Anda</span>
              )}
            </td>
          </tr>
        );
      })}
    </BoardTable>
  );
}
