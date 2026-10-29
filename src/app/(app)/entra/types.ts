import type { EmployeesWithoutEntraQuery } from "@/generated/graphql";

export type EntraListEmployee =
  EmployeesWithoutEntraQuery["employeesWithoutEntra"]["edges"][number]["node"];

export type EntraProvision = NonNullable<EntraListEmployee["entraProvision"]>;

export type ConfirmAction =
  | { kind: "disable"; employee: EntraListEmployee }
  | { kind: "reprovision"; employee: EntraListEmployee };
