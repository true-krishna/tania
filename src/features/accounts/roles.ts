import type { AccessRole } from "@/generated/graphql/types";

/** Human-readable labels for each access role, used across account UI. */
export const roleLabel: Record<AccessRole, string> = {
  ADMIN: "Admin",
  OPERATION: "Operation",
  CHAPTER: "Chapter",
  TALENT: "Talent",
};