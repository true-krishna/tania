"use client";

import { useQuery } from "@apollo/client";
import {
  AssignableTalentsDocument,
  EmployeesDocument,
  type AssignableTalentsQuery,
  type EmployeesQuery,
} from "@/generated/graphql";
import type { EmployeeFilter } from "@/generated/graphql/types";
import {
  usePaginatedConnection,
  type PaginatedConnectionState,
} from "@/lib/apollo/usePaginatedConnection";
import { toQueryState, type QueryState } from "@/lib/apollo/toQueryState";

type AssignableTalentNode =
  AssignableTalentsQuery["assignableTalents"]["edges"][number]["node"];

type EmployeeNode = EmployeesQuery["employees"]["edges"][number]["node"];

export type EmployeesState = Omit<
  PaginatedConnectionState<EmployeeNode>,
  "items"
> & {
  /** Employee rows accumulated across fetched pages. */
  employees: EmployeeNode[] | undefined;
};

/**
 * Employees feature hook (Operation) — US1.
 * Cursor pagination over `employees(filter, first, after)` via the shared
 * accumulate-pages machinery, so the list can grow past one page (T021).
 */
export function useEmployees(filter: EmployeeFilter = {}, first = 25): EmployeesState {
  const { items, ...rest } = usePaginatedConnection({
    document: EmployeesDocument,
    filter,
    first,
    getConnection: (data) => data?.employees,
    withConnection: (previous, employees) => ({ employees }),
  });
  return { ...rest, employees: items };
}

export function useAssignableTalents({
  skip = false,
}: { skip?: boolean } = {}): QueryState<Array<AssignableTalentNode> | undefined> {
  const result = useQuery(AssignableTalentsDocument, {
    variables: { first: 100 },
    skip,
  });
  return toQueryState({
    ...result,
    data: result.data?.assignableTalents?.edges.map((edge) => edge.node),
  });
}
