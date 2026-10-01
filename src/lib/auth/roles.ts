import type { AccessRole } from "@/generated/graphql";

/**
 * Application access roles (map 1:1 with the `AccessRole` enum on the
 * `contracts/schema.graphql` contract). Authorization is ENFORCED server-side
 * (FR-16); this layer only hides menus/actions from roles without access —
 * it is not a security boundary.
 *
 * Ordering drives "is this role in the allowed set or higher" decisions:
 * TALENT < CHAPTER < OPERATION < ADMIN.
 */
export const ROLE_ORDER: Record<AccessRole, number> = {
  TALENT: 0,
  CHAPTER: 1,
  OPERATION: 2,
  ADMIN: 3,
};

export type RoleOrMore = keyof typeof ROLE_ORDER;

/**
 * True when `current` holds `required` or a higher role.
 * Per-role route guards are applied consistently across `(app)/*` layouts and
 * menus (plan.md §10.2: role-guard render tests with different roles ensure
 * menus/actions are hidden).
 */
export function atLeast(current: AccessRole | null | undefined, required: RoleOrMore): boolean {
  if (!current) return false;
  return ROLE_ORDER[current] >= ROLE_ORDER[required];
}