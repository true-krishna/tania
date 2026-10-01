"use client";

import type { User } from "@/generated/graphql/types";
import { useMockQuery } from "@/lib/mock/useMockQuery";
import { users } from "./mock";

/**
 * Accounts feature hook (Admin) — US6.
 * Mock-backed while the backend wave is unserved; swap body for the real
 * `users` query when live.
 */
export function useUsers() {
  return useMockQuery<User[]>(() => users);
}