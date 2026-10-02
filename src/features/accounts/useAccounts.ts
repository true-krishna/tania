"use client";

import { useQuery } from "@apollo/client";
import { UsersDocument, type UsersQuery } from "@/generated/graphql";
import { toQueryState, type QueryState } from "@/lib/apollo/toQueryState";

/**
 * Accounts feature hook (Admin) — US6.
 * Backed by the served `users` query (no pagination; returns all accounts).
 */
export function useUsers(): QueryState<UsersQuery["users"] | undefined> {
  const result = useQuery(UsersDocument);
  return toQueryState({ ...result, data: result.data?.users });
}