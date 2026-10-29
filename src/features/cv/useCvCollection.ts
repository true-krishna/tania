"use client";

import * as React from "react";
import { useMutation } from "@apollo/client";
import type { DocumentNode } from "graphql";
import { useToast } from "@/components/Toast";
import { errorText } from "@/lib/errors";

type CvCollectionMessages = {
  added: string;
  addFailed: string;
  deleted: string;
  deleteFailed: string;
  updated: string;
  updateFailed: string;
};

type UseCvCollectionOptions<TItem, TValues, TInput> = {
  addDocument: DocumentNode;
  buildInput: (values: TValues) => TInput;
  createValues: () => TValues;
  getItemId: (item: TItem) => string;
  messages: CvCollectionMessages;
  refetchDocument: DocumentNode;
  removeDocument: DocumentNode;
  toValues: (item: TItem) => TValues;
  updateDocument: DocumentNode;
};

export function useCvCollection<TItem, TValues, TInput>({
  addDocument,
  buildInput,
  createValues,
  getItemId,
  messages,
  refetchDocument,
  removeDocument,
  toValues,
  updateDocument,
}: UseCvCollectionOptions<TItem, TValues, TInput>) {
  const { pushToast } = useToast();
  const refetchQueries = [{ query: refetchDocument }];
  const [add, { loading: adding }] = useMutation(addDocument, { refetchQueries });
  const [update, { loading: updating }] = useMutation(updateDocument, {
    refetchQueries,
  });
  const [remove, { loading: removing }] = useMutation(removeDocument, {
    refetchQueries,
  });
  const [values, setValues] = React.useState<TValues>(createValues);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const saving = adding || updating || removing;

  function reset() {
    setEditingId(null);
    setValues(createValues());
  }

  function startEditing(item: TItem) {
    setEditingId(getItemId(item));
    setValues(toValues(item));
  }

  async function submit(event?: React.FormEvent) {
    event?.preventDefault();
    const input = buildInput(values);
    const isEditing = editingId !== null;
    try {
      if (isEditing) {
        await update({ variables: { id: editingId, input } });
        pushToast("success", messages.updated);
      } else {
        await add({ variables: { input } });
        pushToast("success", messages.added);
      }
      reset();
    } catch (error) {
      pushToast(
        "error",
        error instanceof Error
          ? error.message
          : isEditing
            ? messages.updateFailed
            : messages.addFailed,
      );
    }
  }

  async function removeItem(id: string) {
    try {
      await remove({ variables: { id } });
      pushToast("success", messages.deleted);
    } catch (error) {
      pushToast("error", errorText(error, messages.deleteFailed));
    }
  }

  return {
    editingId,
    isEditing: editingId !== null,
    removeItem,
    reset,
    saving,
    setValues,
    startEditing,
    submit,
    values,
  };
}
