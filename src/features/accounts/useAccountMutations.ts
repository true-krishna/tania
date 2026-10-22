"use client";

import { useMutation } from "@apollo/client";
import {
  CreateUserAccountDocument,
  RevokeUserSessionsDocument,
  SetUserAccountStatusDocument,
  UpdateUserAccessRoleDocument,
  UsersDocument,
} from "@/generated/graphql";
import type { AccountStatus } from "@/generated/graphql/types";

export type CreateAccountValues = {
  employeeId: string;
  email: string;
  /** Machine name of the access role: a built-in name or a custom role's name. */
  roleName: string;
  temporaryPassword?: string;
};

/**
 * Accounts feature mutations (Admin) — US6 / FR-15.
 * Every mutation refetches `users` so the list reflects the new role/status
 * without a manual reload (same optimistic-refresh pattern as master data).
 */
export function useAccountMutations() {
  const [createAccount, createResult] = useMutation(CreateUserAccountDocument, {
    refetchQueries: [{ query: UsersDocument }],
  });
  const [updateAccessRole] = useMutation(UpdateUserAccessRoleDocument, {
    refetchQueries: [{ query: UsersDocument }],
  });
  const [setAccountStatus] = useMutation(SetUserAccountStatusDocument, {
    refetchQueries: [{ query: UsersDocument }],
  });
  const [revokeSessions] = useMutation(RevokeUserSessionsDocument);

  return {
    create: (values: CreateAccountValues) =>
      createAccount({
        variables: {
          employeeId: values.employeeId,
          email: values.email,
          roleName: values.roleName,
          temporaryPassword: values.temporaryPassword || null,
        },
      }),
    changeRole: (userId: string, roleName: string) =>
      updateAccessRole({ variables: { userId, roleName } }),
    setStatus: (userId: string, status: AccountStatus) =>
      setAccountStatus({ variables: { userId, status } }),
    revokeSessions: (userId: string) => revokeSessions({ variables: { userId } }),
    busy: createResult.loading,
  };
}
