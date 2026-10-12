"use client";

import { useQuery } from "@apollo/client";
import {
  EmployeesNeedingFollowUpDocument,
  ExpiringContractsDocument,
  RetirementAgeDocument,
  type EmployeesNeedingFollowUpQuery,
  type ExpiringContractsQuery,
  type RetirementAgeQuery,
} from "@/generated/graphql";
import { toQueryState, type QueryState } from "@/lib/apollo/toQueryState";

type ExpiringContractNode =
  ExpiringContractsQuery["expiringContracts"]["edges"][number]["node"];

type FollowUpEmployeeNode =
  EmployeesNeedingFollowUpQuery["employeesNeedingFollowUp"]["edges"][number]["node"];

/**
 * Contract-lifecycle widgets for the Operation dashboard (FR-40) — TAN-129.
 * These read the same top-level queries the lifecycle radar uses
 * (`expiringContracts`, `employeesNeedingFollowUp`, `retirementAge`), which the
 * served SDL exposes outside the `Dashboard` union.
 */
export function useExpiringContracts(
  days: number
): QueryState<ExpiringContractNode[] | undefined> {
  const result = useQuery<ExpiringContractsQuery>(ExpiringContractsDocument, {
    variables: { days, first: 25, after: null },
  });
  return toQueryState({
    ...result,
    data: result.data?.expiringContracts?.edges.map((edge) => edge.node),
  });
}

export function useEmployeesNeedingFollowUp(): QueryState<FollowUpEmployeeNode[] | undefined> {
  const result = useQuery<EmployeesNeedingFollowUpQuery>(EmployeesNeedingFollowUpDocument, {
    variables: { first: 25, after: null },
  });
  return toQueryState({
    ...result,
    data: result.data?.employeesNeedingFollowUp?.edges.map((edge) => edge.node),
  });
}

export function useRetirementAge(): QueryState<RetirementAgeQuery["retirementAge"] | undefined> {
  const result = useQuery<RetirementAgeQuery>(RetirementAgeDocument);
  return toQueryState({ ...result, data: result.data?.retirementAge });
}
