"use client";

import type { ApolloError } from "@apollo/client";
import { CHIP_VARIANTS } from "@/components/Chip";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { cn } from "@/lib/cn";
import { errorMessage } from "@/lib/errors";
import type { ChatConversationNode } from "./chatMessages";

export function AssistantConversationItems({
  activeId,
  error,
  hasData,
  loading,
  nodes,
  onSelect,
}: {
  activeId: string | null;
  error: ApolloError | null;
  hasData: boolean;
  loading: boolean;
  nodes: ChatConversationNode[];
  onSelect: (conversationId: string) => void;
}) {
  if (loading && !hasData) return <LoadingState label="Memuat percakapan…" />;
  if (error) return <ErrorState message={errorMessage(error, "Gagal memuat percakapan.")} />;
  if (nodes.length === 0) {
    return <EmptyState message="Belum ada percakapan. Ajukan pertanyaan pertama Anda." />;
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {nodes.map((conversation) => (
        <li key={conversation.id}>
          <button
            aria-current={conversation.id === activeId ? "true" : undefined}
            className={cn(
              "tp-chip",
              conversation.id === activeId
                ? "border border-tp-line bg-tp-brand-red-tint text-tp-brand-red-ink"
                : CHIP_VARIANTS.neutral,
            )}
            onClick={() => onSelect(conversation.id)}
            type="button"
          >
            {conversation.messageCount} pesan
          </button>
        </li>
      ))}
    </ul>
  );
}
