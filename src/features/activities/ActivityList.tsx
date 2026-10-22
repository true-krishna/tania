"use client";

import * as React from "react";
import { Table } from "@/components/Table";
import { Button } from "@/components/Button";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { useTablePagination } from "@/components/Pagination";
import { RowActionsMenu } from "@/components/RowActionsMenu";
import { orDash } from "@/lib/cell";
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
  const { pageRows, pagination } = useTablePagination(activities);

  if (status === "loading") return <LoadingState label="Memuat aktivitas…" />;

  if (status === "error") {
    return (
      <div className="flex flex-col items-start gap-3">
        <ErrorState message={error ?? "Gagal memuat aktivitas."} />
        {onRetry ? (
          <Button onClick={onRetry} type="button" variant="secondary">
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
    <Table
      caption="Daftar aktivitas saya"
      columns={[
        {
          key: "title",
          title: "Aktivitas",
          className: "font-medium text-zinc-900",
          render: (_value, activity) => activity.title,
        },
        {
          key: "type",
          title: "Jenis",
          className: "text-zinc-600",
          render: (_value, activity) => ACTIVITY_TYPE_LABEL[activity.activityType],
        },
        {
          key: "period",
          title: "Periode",
          className: "text-zinc-600",
          render: (_value, activity) => (
            <>
              {activity.startDate} — {activity.endDate ?? "sekarang"}
            </>
          ),
        },
        {
          key: "project",
          title: "Project",
          className: "text-zinc-600",
          render: (_value, activity) => orDash(activity.project?.name),
        },
        {
          key: "priority",
          title: "Prioritas",
          className: "text-zinc-600",
          render: (_value, activity) => activity.priority.name,
        },
        {
          key: "status",
          title: "Status",
          render: (_value, activity) => <ActivityStatusBadge status={activity.status} />,
        },
        {
          key: "actions",
          title: "Aksi",
          className: "col-action",
          render: (_value, activity) => {
            const owned = activity.talentId === currentTalentId;
            return owned ? (
              <RowActionsMenu
                actions={[
                  { label: "Ubah", onSelect: () => onEdit(activity), disabled: busy },
                  { label: "Hapus", onSelect: () => onDelete(activity), danger: true, disabled: busy },
                ]}
                label={`Aksi ${activity.title}`}
              />
            ) : (
              <RowActionsMenu disabled label={`Aksi ${activity.title}`} />
            );
          },
        },
      ]}
      dataSource={pageRows}
      pagination={pagination}
      rowKey={(activity) => activity.id}
    />
  );
}
