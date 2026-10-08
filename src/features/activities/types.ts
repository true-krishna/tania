/**
 * Activity types for the US1 surface (`/activities`).
 *
 * These mirror the fields the served GraphQL contract will expose for
 * `PersonalWorkActivity` (TAN-103/TAN-108). The codegen types are not yet
 * available in `src/generated/graphql/` — the schema delta is still parked on
 * T005 — so this module defines the same shape locally. When codegen lands,
 * delete this file and import the generated types directly (no view-model
 * duplication, data-model.md §5.1).
 */

/** `ActivityType` per the contract: a recorded activity is work or training. */
export type ActivityType = "working" | "training";

/** Reference entity (ActivityPriority / ActivityStatus, seeded by T007). */
export interface ActivityReference {
  id: string;
  name: string;
}

/** Master-data Project, as the form's project select needs it. */
export interface ActivityProject {
  id: string;
  name: string;
}

/**
 * `PersonalWorkActivity` row. Every derived/audit field comes from the server;
 * the client never recomputes it.
 */
export interface PersonalWorkActivity {
  id: string;
  title: string;
  activityType: ActivityType;
  startDate: string;
  endDate: string | null;
  /** Always `null` when `activityType === "training"` (FR-004). */
  project: ActivityProject | null;
  priority: ActivityReference;
  status: ActivityReference;
  /** Owner. Set from the session server-side on create (FR-010). */
  talentId: string;
  createdAt: string;
  updatedAt: string;
}

/** `PersonalWorkActivityFilter` — sent as GraphQL variables, never into the URL. */
export interface PersonalWorkActivityFilter {
  activityType?: ActivityType | null;
  statusId?: string | null;
  projectId?: string | null;
  /** Inclusive lower bound on `startDate` (yyyy-mm-dd). */
  startDate?: string | null;
  /** Inclusive upper bound on `startDate` (yyyy-mm-dd). */
  endDate?: string | null;
}

/** `CreatePersonalWorkActivityInput` payload the form produces. */
export interface ActivityInput {
  title: string;
  activityType: ActivityType;
  startDate: string;
  endDate: string | null;
  projectId: string | null;
  priorityId: string;
  statusId: string;
}
