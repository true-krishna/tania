"use client";

import type { ApolloError } from "@apollo/client";
import { AssistantConversationItems } from "./AssistantConversationItems";
import type { ChatConversationNode } from "./chatMessages";

type AssistantConversationListProps = {
  activeId: string | null;
  error: ApolloError | null;
  hasData: boolean;
  loading: boolean;
  nodes: ChatConversationNode[];
  onSelect: (conversationId: string) => void;
};

export function AssistantConversationList({
  activeId,
  error,
  hasData,
  loading,
  nodes,
  onSelect,
}: AssistantConversationListProps) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-tp-muted">Percakapan saya</p>
      <AssistantConversationItems
        activeId={activeId}
        error={error}
        hasData={hasData}
        loading={loading}
        nodes={nodes}
        onSelect={onSelect}
      />
    </div>
  );
}
