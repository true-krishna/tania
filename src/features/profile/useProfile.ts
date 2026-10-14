"use client";

import { useQuery } from "@apollo/client";
import { ProfileDocument, type ProfileQuery } from "@/generated/graphql";
import { toQueryState, type QueryState } from "@/lib/apollo/toQueryState";

export type ProfileEmployee = NonNullable<ProfileQuery["me"]["employee"]>;
export type ProfileContract = ProfileEmployee["contracts"]["edges"][number]["node"];
export type ProfileAssignment = ProfileEmployee["assignments"]["edges"][number]["node"];

export interface ProfileSession {
  id: string;
  email: string;
  fullName: string;
}

/**
 * Own profile (TAN-188): `me` plus the employee record with its contract and
 * assignment history. `employee` is null for accounts without an employee
 * record (e.g. pure Admin) — callers treat that as an empty state, not an
 * error.
 */
export function useProfile(): QueryState<ProfileEmployee | undefined> & {
  session: ProfileSession | undefined;
} {
  const result = useQuery(ProfileDocument);
  return {
    ...toQueryState({
      ...result,
      data: result.data ? (result.data.me.employee ?? undefined) : undefined,
    }),
    session: result.data
      ? {
          id: result.data.me.id,
          email: result.data.me.email,
          fullName: result.data.me.fullName,
        }
      : undefined,
  };
}
