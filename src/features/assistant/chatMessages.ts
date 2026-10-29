import type { ChatConversationsQuery } from "@/generated/graphql";

export type PendingSend = {
  clientRequestId: string;
  content: string;
  status: "sending" | "failed";
};

export type ChatMessageNode = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  clientRequestId?: string | null;
};

export type ChatConversationNode =
  ChatConversationsQuery["chatConversations"]["edges"][number]["node"];

export function unansweredUserMessages(messages: readonly ChatMessageNode[]): ChatMessageNode[] {
  let lastAssistantIndex = -1;
  messages.forEach((message, index) => {
    if (message.role === "ASSISTANT") lastAssistantIndex = index;
  });

  return messages.filter(
    (message, index) =>
      message.role === "USER" && index > lastAssistantIndex && Boolean(message.clientRequestId),
  );
}

export function newClientRequestId(): string {
  return crypto.randomUUID();
}
