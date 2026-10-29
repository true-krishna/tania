"use client";

import type { ApolloError } from "@apollo/client";
import type { ChatMessageNode, PendingSend } from "./chatMessages";
import { AssistantMessageBody } from "./AssistantMessageBody";

type AssistantMessageThreadProps = {
  activeId: string | null;
  activePending: PendingSend[];
  busy: boolean;
  error: ApolloError | null;
  hasData: boolean;
  loading: boolean;
  onRetry: (content: string, clientRequestId: string) => void;
  quotaMessage: string | null;
  thread: ChatMessageNode[];
  unanswered: ChatMessageNode[];
};

export function AssistantMessageThread({
  activeId,
  activePending,
  busy,
  error,
  hasData,
  loading,
  onRetry,
  quotaMessage,
  thread,
  unanswered,
}: AssistantMessageThreadProps) {
  return (
    <div className="flex flex-1 flex-col gap-3">
      <AssistantMessageBody
        activeId={activeId}
        activePending={activePending}
        busy={busy}
        error={error}
        hasData={hasData}
        loading={loading}
        onRetry={onRetry}
        quotaMessage={quotaMessage}
        thread={thread}
        unanswered={unanswered}
      />
    </div>
  );
}
