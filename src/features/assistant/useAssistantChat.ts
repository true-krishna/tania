"use client";

import * as React from "react";
import { useMutation, useQuery, type ApolloError } from "@apollo/client";
import {
  ChatConversationsDocument,
  ChatMessagesDocument,
  CreateChatConversationDocument,
  SendChatMessageDocument,
} from "@/generated/graphql";
import { useToast } from "@/components/Toast";
import {
  errorMessage,
  errorRetryAfterSeconds,
  graphQLErrorCode,
} from "@/lib/errors";
import { CHAT_MAX_LENGTH, type AssistantRole } from "./assistantConfig";
import {
  newClientRequestId,
  unansweredUserMessages,
  type PendingSend,
} from "./chatMessages";

type QuotaState = {
  message: string;
  retryAfterSeconds: number;
};

export function useAssistantChat({
  open,
  role,
}: {
  open: boolean;
  role: AssistantRole | null;
}) {
  const { pushToast } = useToast();
  const [selectedId, setSelectedId] = React.useState<
    string | null | undefined
  >(undefined);
  const [draft, setDraft] = React.useState("");
  const [pending, setPending] = React.useState<Record<string, PendingSend[]>>(
    {}
  );
  const [quota, setQuota] = React.useState<QuotaState | null>(null);

  const conversations = useQuery(ChatConversationsDocument, {
    skip: !open || !role,
    fetchPolicy: "cache-and-network",
  });

  const defaultConversationId =
    conversations.data?.chatConversations.edges[0]?.node.id ?? null;
  const activeId =
    selectedId === undefined ? defaultConversationId : selectedId;

  const messages = useQuery(ChatMessagesDocument, {
    variables: { conversationId: activeId ?? "" },
    skip: !open || !role || !activeId,
    fetchPolicy: "cache-and-network",
  });

  const [createConversation] = useMutation(CreateChatConversationDocument);
  const [sendMessage, sendState] = useMutation(SendChatMessageDocument);

  const quotaWaitMs = (quota?.retryAfterSeconds ?? 0) * 1000;
  React.useEffect(() => {
    if (!quota) return;
    const timer = window.setTimeout(
      () => setQuota(null),
      Math.max(quotaWaitMs, 1000)
    );
    return () => window.clearTimeout(timer);
  }, [quota, quotaWaitMs]);

  const activePending = activeId ? (pending[activeId] ?? []) : [];

  async function deliver(
    conversationId: string,
    content: string,
    clientRequestId: string
  ) {
    setPending((previous) => {
      const list = previous[conversationId] ?? [];
      const exists = list.some(
        (item) => item.clientRequestId === clientRequestId
      );
      const next = exists
        ? list.map((item) =>
            item.clientRequestId === clientRequestId
              ? { ...item, status: "sending" as const }
              : item
          )
        : [...list, { clientRequestId, content, status: "sending" as const }];
      return { ...previous, [conversationId]: next };
    });

    try {
      await sendMessage({
        variables: { conversationId, content, clientRequestId },
      });
      setPending((previous) => ({
        ...previous,
        [conversationId]: (previous[conversationId] ?? []).filter(
          (item) => item.clientRequestId !== clientRequestId
        ),
      }));
      setQuota(null);
      if (conversationId === activeId) await messages.refetch();
    } catch (error) {
      setPending((previous) => ({
        ...previous,
        [conversationId]: (previous[conversationId] ?? []).map((item) =>
          item.clientRequestId === clientRequestId
            ? { ...item, status: "failed" as const }
            : item
        ),
      }));
      const apolloError = error as ApolloError;
      if (graphQLErrorCode(apolloError) === "CHAT_RATE_LIMITED") {
        setQuota({
          message: errorMessage(
            apolloError,
            "Batas pertanyaan per jam tercapai."
          ),
          retryAfterSeconds: errorRetryAfterSeconds(apolloError) ?? 0,
        });
        return;
      }
      pushToast(
        "error",
        errorMessage(
          apolloError,
          "Asisten gagal menjawab. Silakan coba lagi."
        )
      );
    }
  }

  async function handleSend() {
    const content = draft.trim();
    if (!content || content.length > CHAT_MAX_LENGTH) return;

    let conversationId = activeId;
    if (!conversationId) {
      try {
        const created = await createConversation();
        conversationId = created.data?.createChatConversation.id ?? null;
        if (!conversationId) {
          throw new Error("percakapan baru tidak mengembalikan id");
        }
        setSelectedId(conversationId);
      } catch (error) {
        pushToast(
          "error",
          errorMessage(
            error as ApolloError,
            "Percakapan baru gagal dibuat. Silakan coba lagi."
          )
        );
        return;
      }
    }

    const clientRequestId = newClientRequestId();
    setDraft("");
    void deliver(conversationId, content, clientRequestId);
  }

  function retry(content: string, clientRequestId: string) {
    if (!activeId) return;
    void deliver(activeId, content, clientRequestId);
  }

  function startNewConversation() {
    setSelectedId(null);
    setDraft("");
  }

  const conversationNodes =
    conversations.data?.chatConversations.edges.map((edge) => edge.node) ?? [];
  const thread = activeId
    ? [
        ...(messages.data?.chatMessages.edges.map((edge) => edge.node) ?? []),
      ].reverse()
    : [];
  const unanswered = unansweredUserMessages(thread);
  const busy =
    sendState.loading || activePending.some((item) => item.status === "sending");

  return {
    activeId,
    activePending,
    busy,
    conversations,
    conversationNodes,
    draft,
    handleSend,
    messages,
    quota,
    retry,
    setDraft,
    setSelectedId,
    startNewConversation,
    thread,
    unanswered,
  };
}
