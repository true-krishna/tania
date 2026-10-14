"use client";

import Link from "next/link";
import * as React from "react";
import { BoardTable } from "@/components/BoardTable";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { Pagination, useTablePagination } from "@/components/Pagination";
import {
  ACTIVITY_TYPE_LABEL,
  ActivitiesProvider,
  ActivityStatusBadge,
  useActivities,
} from "@/features/activities";
import type { PersonalWorkActivity } from "@/features/activities";

/**
 * Activity section of `/profile` (TAN-188) — a read-only digest of the user's
 * most recent activities; capture and editing stay on `/activities`.
 */
export function ActivitiesSection() {
  return (
    <ActivitiesProvider>
      <RecentActivities />
    </ActivitiesProvider>
  );
}

function RecentActivities() {
  const { status, data, error, reload } = useActivities();
  const { pageRows, pagination } = useTablePagination(data, { initialPageSize: 5 });

  if (status === "loading") return <LoadingState label="Memuat aktivitas…" />;

  if (status === "error") {
    return (
      <div className="flex flex-col items-start gap-3">
        <ErrorState message={error ?? "Gagal memuat aktivitas."} />
        <Button type="button" variant="secondary" onClick={reload}>
          Coba lagi
        </Button>
      </div>
    );
  }

  const activities = data ?? [];

  return (
    <Card padded={false} className="max-w-3xl">
      {activities.length === 0 ? (
        <div className="px-5 py-4">
          <EmptyState message="Belum ada aktivitas tercatat." />
        </div>
      ) : (
        <>
          <BoardTable
            caption="Aktivitas terbaru"
            columns={[
              { key: "title", label: "Aktivitas" },
              { key: "type", label: "Jenis" },
              { key: "period", label: "Periode" },
              { key: "project", label: "Project" },
              { key: "status", label: "Status" },
            ]}
            footer={<Pagination {...pagination} />}
          >
            {pageRows.map((activity) => (
              <RecentActivityRow key={activity.id} activity={activity} />
            ))}
          </BoardTable>
          <div className="border-t border-board-border px-4 py-3">
            <Link href="/activities" className="text-sm font-medium text-zinc-900 hover:underline">
              Kelola aktivitas →
            </Link>
          </div>
        </>
      )}
    </Card>
  );
}

function RecentActivityRow({ activity }: { activity: PersonalWorkActivity }) {
  return (
    <tr className="border-b border-board-border last:border-b-0">
      <td className="px-4 py-2.5 font-medium text-zinc-900">{activity.title}</td>
      <td className="px-4 py-2.5 text-zinc-600">{ACTIVITY_TYPE_LABEL[activity.activityType]}</td>
      <td className="px-4 py-2.5 text-zinc-600">
        {activity.startDate} — {activity.endDate ?? "sekarang"}
      </td>
      <td className="px-4 py-2.5 text-zinc-600">{activity.project?.name ?? "—"}</td>
      <td className="px-4 py-2.5">
        <ActivityStatusBadge status={activity.status} />
      </td>
    </tr>
  );
}