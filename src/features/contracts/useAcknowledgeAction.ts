"use client";

import * as React from "react";
import { ApolloError, useMutation } from "@apollo/client";
import type { DocumentNode } from "graphql";
import { graphQLErrorCode, mapSubmitError } from "@/lib/errors";
import { todayISO } from "./contractCycle";

type RefetchTarget = {
  query: DocumentNode;
  variables?: Record<string, unknown>;
};

type UseAcknowledgeActionOptions = {
  conflictMessage: string;
  fallbackMessage: string;
  mutationDocument: DocumentNode;
  refetchQueries: RefetchTarget[];
};

function isPrecondition(error: unknown): boolean {
  return (
    error instanceof ApolloError &&
    graphQLErrorCode(error) === "PRECONDITION_FAILED"
  );
}

export function useAcknowledgeAction({
  conflictMessage,
  fallbackMessage,
  mutationDocument,
  refetchQueries,
}: UseAcknowledgeActionOptions) {
  const [mutate, { loading }] = useMutation(mutationDocument, {
    refetchQueries,
  });
  const [effectiveDate, setEffectiveDate] = React.useState(todayISO);
  const [dateError, setDateError] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [needsAck, setNeedsAck] = React.useState(false);
  const [done, setDone] = React.useState(false);

  function updateEffectiveDate(nextDate: string) {
    setEffectiveDate(nextDate);
    setDateError(null);
  }

  async function submit(
    acknowledgeActiveWork: boolean,
    buildVariables: (effectiveDate: string) => Record<string, unknown>
  ) {
    setFormError(null);
    setDateError(null);
    if (!effectiveDate) {
      setDateError("Tanggal efektif wajib diisi.");
      return;
    }
    try {
      await mutate({ variables: buildVariables(effectiveDate) });
      setDone(true);
      setNeedsAck(false);
    } catch (error) {
      if (!acknowledgeActiveWork && isPrecondition(error)) {
        setNeedsAck(true);
        return;
      }
      const submitError = mapSubmitError(
        error instanceof ApolloError ? error : null,
        conflictMessage,
        fallbackMessage
      );
      if (submitError.field === "effectiveDate") {
        setDateError(submitError.message);
      } else {
        setFormError(submitError.message);
      }
    }
  }

  return {
    dateError,
    done,
    effectiveDate,
    formError,
    loading,
    needsAck,
    setNeedsAck,
    submit,
    updateEffectiveDate,
  };
}
