import type { AccessRole, Role } from "@/generated/graphql/types";

/** Human-readable labels for each built-in access role, used across account UI. */
export const roleLabel: Record<AccessRole, string> = {
  ADMIN: "Admin",
  OPERATION: "Operation",
  CHAPTER: "Chapter",
  TALENT: "Talent",
};

/** Machine names of the four built-ins, in the order the pickers list them. */
export const BUILT_IN_ROLES: readonly AccessRole[] = ["ADMIN", "OPERATION", "CHAPTER", "TALENT"];

/**
 * One choice of a role picker: the machine name stored in `users.role` and the
 * label shown. Built-ins keep their canonical labels; a custom role uses the
 * label an Admin gave it, so the picker needs no static list of its own
 * (W3 / TAN-264 — custom roles come from the API).
 */
export interface RoleOption {
  value: string;
  label: string;
  templateRole: AccessRole;
  builtIn: boolean;
}

function optionOf(role: Role): RoleOption {
  return {
    value: role.name,
    label: role.builtIn ? (roleLabel[role.templateRole] ?? role.label) : role.label,
    templateRole: role.templateRole,
    builtIn: role.builtIn,
  };
}

/** Active roles a picker may assign, built-ins first, in catalog order. */
export function roleOptions(roles: readonly Role[] | undefined): RoleOption[] {
  const active = (roles ?? []).filter((role) => role.status === "ACTIVE");
  const builtIn = active.filter((role) => role.builtIn).map(optionOf);
  const custom = active.filter((role) => !role.builtIn).map(optionOf);
  return [...builtIn, ...custom];
}

/**
 * Label of a stored role name. Falls back to the name itself when the role is
 * missing from the list (inactive, or a name stored before the role was
 * created), so an account never renders as a blank chip.
 */
export function roleLabelFor(name: string, options: readonly RoleOption[]): string {
  return options.find((option) => option.value === name)?.label ?? name;
}
