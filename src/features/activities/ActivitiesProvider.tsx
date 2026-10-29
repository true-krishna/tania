"use client";

import * as React from "react";
import { CURRENT_TALENT_ID, SEED_ACTIVITIES, findPriority, findProject, findStatus } from "./mocks";
import type { ActivityInput, PersonalWorkActivity } from "./types";

export type ActivitiesStatus = "loading" | "ready" | "error";

export interface ActivitiesStoreValue {
  status: ActivitiesStatus;
  error: string | null;
  activities: PersonalWorkActivity[];
  currentTalentId: string;
  reload: () => void;
  create: (input: ActivityInput) => Promise<PersonalWorkActivity>;
  update: (id: string, input: ActivityInput) => Promise<PersonalWorkActivity>;
  remove: (id: string) => Promise<void>;
}

const ActivitiesStoreContext = React.createContext<ActivitiesStoreValue | null>(null);

export function useActivitiesStore(): ActivitiesStoreValue {
  const store = React.useContext(ActivitiesStoreContext);
  if (!store) {
    throw new Error("useActivitiesStore harus dipakai di dalam <ActivitiesProvider>.");
  }
  return store;
}

interface ActivitiesProviderProps {
  children: React.ReactNode;
  seed?: PersonalWorkActivity[];
  loadError?: string | null;
  currentTalentId?: string;
  delayMs?: number;
}

export function ActivitiesProvider({
  children,
  seed = SEED_ACTIVITIES,
  loadError = null,
  currentTalentId = CURRENT_TALENT_ID,
  delayMs = 250,
}: ActivitiesProviderProps) {
  const [status, setStatus] = React.useState<ActivitiesStatus>("loading");
  const [error, setError] = React.useState<string | null>(null);
  const [activities, setActivities] = React.useState<PersonalWorkActivity[]>([]);
  const [reloadKey, setReloadKey] = React.useState(0);
  const localId = React.useRef(0);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate: entering the loading state is the point of a refetch
    setStatus("loading");
    setError(null);
    const timer = setTimeout(() => {
      if (loadError) {
        setStatus("error");
        setError(loadError);
        return;
      }
      setActivities(seed);
      setStatus("ready");
    }, delayMs);

    return () => clearTimeout(timer);
  }, [reloadKey, seed, loadError, delayMs]);

  const reload = React.useCallback(() => setReloadKey((key) => key + 1), []);

  const create = React.useCallback(
    async (input: ActivityInput) => {
      localId.current += 1;
      const now = new Date().toISOString();
      const created: PersonalWorkActivity = {
        id: `act-local-${localId.current}`,
        title: input.title.trim(),
        activityType: input.activityType,
        startDate: input.startDate,
        endDate: input.endDate,
        project: input.activityType === "training" ? null : findProject(input.projectId),
        priority: findPriority(input.priorityId) ?? {
          id: input.priorityId,
          name: input.priorityId,
        },
        status: findStatus(input.statusId) ?? { id: input.statusId, name: input.statusId },
        talentId: currentTalentId,
        createdAt: now,
        updatedAt: now,
      };
      setActivities((prev) => [created, ...prev]);
      return created;
    },
    [currentTalentId],
  );

  const update = React.useCallback(
    async (id: string, input: ActivityInput) => {
      const existing = activities.find((row) => row.id === id);
      if (!existing) throw new Error("Aktivitas tidak ditemukan.");
      const updated: PersonalWorkActivity = {
        ...existing,
        title: input.title.trim(),
        activityType: input.activityType,
        startDate: input.startDate,
        endDate: input.endDate,
        project: input.activityType === "training" ? null : findProject(input.projectId),
        priority: findPriority(input.priorityId) ?? existing.priority,
        status: findStatus(input.statusId) ?? existing.status,
        updatedAt: new Date().toISOString(),
      };
      setActivities((prev) => prev.map((row) => (row.id === id ? updated : row)));
      return updated;
    },
    [activities],
  );

  const remove = React.useCallback(async (id: string) => {
    setActivities((prev) => prev.filter((row) => row.id !== id));
  }, []);

  const value = React.useMemo<ActivitiesStoreValue>(
    () => ({
      status,
      error,
      activities,
      currentTalentId,
      reload,
      create,
      update,
      remove,
    }),
    [status, error, activities, currentTalentId, reload, create, update, remove],
  );

  return (
    <ActivitiesStoreContext.Provider value={value}>{children}</ActivitiesStoreContext.Provider>
  );
}
