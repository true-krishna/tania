import type {
  ActivityProject,
  ActivityReference,
  ActivityType,
  PersonalWorkActivity,
} from "./types";

/**
 * Isolated mock data for the mock-data-first US1 slice (same pattern as
 * `src/features/workload/mocks.ts`). GraphQL wiring replaces this module; the
 * components and hooks keep their shapes.
 *
 * No personal data beyond a display label lives here, and nothing is persisted
 * (no localStorage) — state lives in `ActivitiesProvider`'s memory only.
 */

export const CURRENT_TALENT_ID = "emp-001";

export const ACTIVITY_TYPE_LABEL: Record<ActivityType, string> = {
  working: "Bekerja",
  training: "Pelatihan",
};

export const ACTIVITY_PRIORITIES: ActivityReference[] = [
  { id: "prio-low", name: "Rendah" },
  { id: "prio-medium", name: "Sedang" },
  { id: "prio-high", name: "Tinggi" },
];

export const ACTIVITY_STATUSES: ActivityReference[] = [
  { id: "status-todo", name: "Belum mulai" },
  { id: "status-progress", name: "Berjalan" },
  { id: "status-done", name: "Selesai" },
];

export const ACTIVITY_PROJECTS: ActivityProject[] = [
  { id: "proj-tania", name: "Portal Tania" },
  { id: "proj-wad", name: "Integrasi WAD" },
  { id: "proj-idata", name: "Migrasi iData" },
];

export function findPriority(id: string | null | undefined): ActivityReference | null {
  return ACTIVITY_PRIORITIES.find((p) => p.id === id) ?? null;
}

export function findStatus(id: string | null | undefined): ActivityReference | null {
  return ACTIVITY_STATUSES.find((s) => s.id === id) ?? null;
}

export function findProject(id: string | null | undefined): ActivityProject | null {
  return ACTIVITY_PROJECTS.find((p) => p.id === id) ?? null;
}

function activity(
  id: string,
  title: string,
  activityType: ActivityType,
  startDate: string,
  endDate: string | null,
  projectId: string | null,
  priorityId: string,
  statusId: string,
): PersonalWorkActivity {
  const priority = findPriority(priorityId);
  const status = findStatus(statusId);
  if (!priority || !status) throw new Error(`mock activity ${id} has unknown reference data`);
  return {
    id,
    title,
    activityType,
    startDate,
    endDate,
    project: activityType === "training" ? null : findProject(projectId),
    priority,
    status,
    talentId: CURRENT_TALENT_ID,
    createdAt: "2026-10-01T02:00:00Z",
    updatedAt: "2026-10-01T02:00:00Z",
  };
}

/** Two owned rows (one working, one training) so the list is never a single shape. */
export const SEED_ACTIVITIES: PersonalWorkActivity[] = [
  activity(
    "act-001",
    "Implementasi form aktivitas",
    "working",
    "2026-10-01",
    "2026-10-03",
    "proj-tania",
    "prio-high",
    "status-progress",
  ),
  activity(
    "act-002",
    "Pelatihan Go Clean Architecture",
    "training",
    "2026-09-22",
    null,
    null,
    "prio-medium",
    "status-done",
  ),
];
