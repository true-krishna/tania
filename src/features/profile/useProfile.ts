"use client";

import { useQuery } from "@apollo/client";
import {
  ProfileDocument,
  ProfileHistoryDocument,
  type ProfileHistoryQuery,
  type ProfileQuery,
} from "@/generated/graphql";
import { toQueryState, type RefetchableQueryState } from "@/lib/apollo/toQueryState";

export type ProfileEmployee = NonNullable<ProfileQuery["me"]["employee"]>;
export type ProfileHistoryEmployee = NonNullable<ProfileHistoryQuery["me"]["employee"]>;
export type ProfileContract = ProfileHistoryEmployee["contracts"]["edges"][number]["node"];
export type ProfileAssignment = ProfileHistoryEmployee["assignments"]["edges"][number]["node"];

export interface ProfileSession {
  id: string;
  email: string;
  fullName: string;
}

export interface ProfileHistory {
  contracts: readonly ProfileContract[];
  assignments: readonly ProfileAssignment[];
}

/**
 * Own profile (TAN-188): `me` plus the employee record. `employee` is null for
 * accounts without an employee record (e.g. pure Admin) — callers treat that as
 * an empty state, not an error.
 *
 * Sejak TAN-343 riwayat kontrak & assignment diambil lewat `useProfileHistory`
 * terpisah: subfield `contracts`/`assignments` me-return FORBIDDEN untuk peran
 * tanpa selnya, dan propagasi non-null GraphQL akan menggugurkan seluruh
 * `me.employee` bila digabung dalam satu query.
 */
export function useProfile(): RefetchableQueryState<ProfileEmployee | undefined> & {
  session: ProfileSession | undefined;
} {
  const result = useQuery(ProfileDocument);
  return {
    ...toQueryState({
      ...result,
      data: result.data ? (result.data.me.employee ?? undefined) : undefined,
    }),
    refetch: () => {
      void result.refetch();
    },
    session: result.data
      ? {
          id: result.data.me.id,
          email: result.data.me.email,
          fullName: result.data.me.fullName,
        }
      : undefined,
  };
}

/**
 * Riwayat kontrak & assignment milik sendiri. `enabled` harus false untuk peran
 * yang tidak memegang sel `contracts`/`assignments` (mis. Talent setelah
 * TAN-343) — query tidak dijalankan dan tidak akan memicu resolusi FORBIDDEN.
 */
export function useProfileHistory(enabled: boolean): RefetchableQueryState<ProfileHistory> {
  const result = useQuery(ProfileHistoryDocument, { skip: !enabled });
  const employee = result.data?.me.employee;
  return {
    ...toQueryState({
      ...result,
      data: result.data
        ? {
            contracts: employee ? employee.contracts.edges.map((edge) => edge.node) : [],
            assignments: employee ? employee.assignments.edges.map((edge) => edge.node) : [],
          }
        : undefined,
    }),
    refetch: () => {
      void result.refetch();
    },
  };
}
