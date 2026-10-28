"use client";

import { useQuery } from "@apollo/client";
import {
  ChaptersDocument,
  JobRolesDocument,
  ProjectsDocument,
  UnitsDocument,
  type ChaptersQuery,
  type JobRolesQuery,
  type ProjectsQuery,
  type UnitsQuery,
} from "@/generated/graphql";
import { toQueryState, type QueryState } from "@/lib/apollo/toQueryState";

/**
 * Master-data feature hooks (Admin) — US6.
 *
 * Backed by the served `units`/`chapters`/`jobRoles`/`projects` queries.
 * Inactive rows are included so the admin list shows the real active state
 * (the pages render a Status badge from each entity's `isActive`).
 */
export function useUnits(): QueryState<UnitsQuery["units"] | undefined> {
  const result = useQuery(UnitsDocument, { variables: { includeInactive: true } });
  return toQueryState({ ...result, data: result.data?.units });
}

export function useChapters(): QueryState<ChaptersQuery["chapters"] | undefined> {
  const result = useQuery(ChaptersDocument, { variables: { includeInactive: true } });
  return toQueryState({ ...result, data: result.data?.chapters });
}

export function useJobRoles(): QueryState<JobRolesQuery["jobRoles"] | undefined> {
  const result = useQuery(JobRolesDocument, { variables: { includeInactive: true } });
  return toQueryState({ ...result, data: result.data?.jobRoles });
}

export function useProjects({
  skip = false,
}: { skip?: boolean } = {}): QueryState<ProjectsQuery["projects"] | undefined> {
  const result = useQuery(ProjectsDocument, {
    variables: { includeInactive: true },
    skip,
  });
  return toQueryState({ ...result, data: result.data?.projects });
}