"use client";

import { EmployeeLookupDocument, type EmployeeLookupQuery } from "@/generated/graphql";
import type { EmployeeFilter } from "@/generated/graphql/types";
import {
  usePaginatedConnection,
  type PaginatedConnectionState,
} from "@/lib/apollo/usePaginatedConnection";

type LookupNode = EmployeeLookupQuery["employeeLookup"]["edges"][number]["node"];

export type EmployeeLookupState = PaginatedConnectionState<LookupNode>;

/**
 * Employee lookup for the Add-Account form (TAN-371). `employeeLookup` follows
 * the Accounts cell — which Admin holds — instead of the Data Karyawan cell
 * TAN-343 took away from Admin, so the picker inside the Admin-only form works
 * without reopening the employees module to Admin.
 */
export function useEmployeeLookup(filter: EmployeeFilter = {}, first = 25): EmployeeLookupState {
  return usePaginatedConnection({
    document: EmployeeLookupDocument,
    filter,
    first,
    getConnection: (data) => data?.employeeLookup,
    withConnection: (previous, employeeLookup) => ({ employeeLookup }),
  });
}
