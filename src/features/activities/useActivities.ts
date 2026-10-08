"use client";

import * as React from "react";
import { useActivitiesStore } from "./ActivitiesProvider";
import type { PersonalWorkActivity, PersonalWorkActivityFilter } from "./types";

/**
 * Pure filter applied client-side for the mock slice. Sent to the server as
 * `PersonalWorkActivityFilter` once GraphQL wiring lands — never into the URL.
 */
export function filterActivities(
  activities: PersonalWorkActivity[],
  filter: PersonalWorkActivityFilter,
): PersonalWorkActivity[] {
  return activities.filter((activity) => {
    if (filter.activityType && activity.activityType !== filter.activityType) return false;
    if (filter.statusId && activity.status.id !== filter.statusId) return false;
    if (filter.projectId && activity.project?.id !== filter.projectId) return false;
    if (filter.startDate && activity.startDate < filter.startDate) return false;
    if (filter.endDate && activity.startDate > filter.endDate) return false;
    return true;
  });
}

export interface ActivitiesResult {
  status: "loading" | "ready" | "error";
  data: PersonalWorkActivity[] | undefined;
  error: string | null;
  reload: () => void;
}

/** Own-activity list with the active filter applied. */
export function useActivities(filter: PersonalWorkActivityFilter = {}): ActivitiesResult {
  const { activities, status, error, reload } = useActivitiesStore();

  // A flat key of every primitive filter field keeps the memo stable across
  // renders that create a fresh filter object literal.
  const filterKey = [
    filter.activityType ?? "",
    filter.statusId ?? "",
    filter.projectId ?? "",
    filter.startDate ?? "",
    filter.endDate ?? "",
  ].join("|");

  const data = React.useMemo(
    () => filterActivities(activities, filter),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filterKey captures every filter field
    [activities, filterKey],
  );

  return {
    status,
    data: status === "ready" ? data : undefined,
    error,
    reload,
  };
}
