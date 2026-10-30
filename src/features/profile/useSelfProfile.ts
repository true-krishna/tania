"use client";

import { useQuery } from "@apollo/client";
import {
  MyAccountSecurityDocument,
  MyAuditTrailDocument,
  MyProfileMetricsDocument,
  type MyAccountSecurityQuery,
  type MyAuditTrailQuery,
  type MyProfileMetricsQuery,
} from "@/generated/graphql";
import { toQueryState, type RefetchableQueryState } from "@/lib/apollo/toQueryState";

export type SelfProfileMetrics = MyProfileMetricsQuery["myProfileMetrics"];
export type SelfAccountSecurity = MyAccountSecurityQuery["myAccountSecurity"];
export type SelfAuditEntry = MyAuditTrailQuery["myAuditTrail"][number];

/**
 * Self-scoped reads of the profile page (TAN-387). Every query resolves the
 * employee from the caller's identity, so no id is ever passed in.
 */
export function useMyProfileMetrics(): RefetchableQueryState<SelfProfileMetrics> {
  const result = useQuery(MyProfileMetricsDocument);
  return {
    ...toQueryState({ ...result, data: result.data?.myProfileMetrics }),
    refetch: () => {
      void result.refetch();
    },
  };
}

export function useMyAccountSecurity(): RefetchableQueryState<SelfAccountSecurity> {
  const result = useQuery(MyAccountSecurityDocument);
  return {
    ...toQueryState({ ...result, data: result.data?.myAccountSecurity }),
    refetch: () => {
      void result.refetch();
    },
  };
}

export function useMyAuditTrail(
  first = 5,
): RefetchableQueryState<readonly SelfAuditEntry[] | undefined> {
  const result = useQuery(MyAuditTrailDocument, { variables: { first } });
  return {
    ...toQueryState({ ...result, data: result.data?.myAuditTrail }),
    refetch: () => {
      void result.refetch();
    },
  };
}
