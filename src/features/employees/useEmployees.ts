"use client";

import { useQuery } from "@apollo/client";
import {
  AssignableTalentsDocument,
  EmployeesDocument,
  type AssignableTalentsQuery,
  type EmployeesQuery,
  type EmployeesQueryVariables,
} from "@/generated/graphql";

import { toQueryState, type QueryState } from "@/lib/apollo/toQueryState";

type AssignableTalentNode =
  AssignableTalentsQuery["assignableTalents"]["edges"][number]["node"];

type EmployeeNode = EmployeesQuery["employees"]["edges"][number]["node"];

/**
 * Employees feature hook (Operation) — US1.
 * Backed by the served `employees(filter, first, after)` query (connection).
 * The connection's `edges[].node` is mapped to a plain array so pages consume
 * the same `Employee[]` shape they did under the mock seam.
 */
export function useEmployees(filter: EmployeesQueryVariables["filter"] = {}): QueryState<
  Array<EmployeeNode> | undefined
> {
  const clean = Object.fromEntries(
    Object.entries(filter ?? {}).filter(([, v]) => v !== undefined)
  ) as typeof filter;
  const result = useQuery(EmployeesDocument, { variables: { filter: clean, first: 100 } });
  return toQueryState({
    ...result,
    data: result.data?.employees?.edges.map((edge) => edge.node),
  });
}

export function useAssignableTalents(): QueryState<Array<AssignableTalentNode> | undefined> {
  const result = useQuery(AssignableTalentsDocument, { variables: { first: 100 } });
  return toQueryState({
    ...result,
    data: result.data?.assignableTalents?.edges.map((edge) => edge.node),
  });
}