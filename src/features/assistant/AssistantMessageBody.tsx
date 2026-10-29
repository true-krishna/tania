"use client";

import type { ApolloError } from "@apollo/client";
import { Button } from "@/components/Button";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { errorMessage } from "@/lib/errors";
import { AssistantMessageBubble } from "./AssistantMessageBubble";
import type { ChatMessageNode, PendingSend } from "./chatMessages";

export function AssistantMessageBody({
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
}: {
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
}) {
  if (activeId && loading && !hasData) return <LoadingState label="Memuat riwayat…" />;
  if (activeId && error) {
    return (
      <ErrorState
        message={errorMessage(error, "Percakapan tidak ditemukan atau bukan milik Anda.")}
      />
    );
  }
  if (thread.length === 0 && activePending.length === 0) {
    return <EmptyState message="Mulai dengan salah satu pertanyaan contoh di bawah." />;
  }

  return (
    <div className="flex flex-col gap-3">
      {thread.map((message) => {
        const clientRequestId = message.clientRequestId;
        const isUnanswered = unanswered.some((item) => item.id === message.id);

        return (
          <AssistantMessageBubble
            content={message.content}
            footer={
              isUnanswered ? (
                <div className="mt-2 flex items-center gap-2 text-xs text-tp-ink-peach">
                  <span>Belum terjawab</span>
                  {!quotaMessage && clientRequestId ? (
                    <Button
                      className="text-xs"
                      onClick={() => onRetry(message.content, clientRequestId)}
                      variant="secondary"
                    >
                      Coba ulang
                    </Button>
                  ) : null}
                </div>
              ) : undefined
            }
            key={message.id}
            role={message.role}
          />
        );
      })}
      {activePending.map((item) => (
        <AssistantMessageBubble
          content={item.content}
          footer={
            item.status === "failed" ? (
              <div className="mt-2 flex items-center gap-2 text-xs text-tp-ink-peach">
                <span>Belum terkirim</span>
                {!quotaMessage ? (
                  <Button
                    className="text-xs"
                    onClick={() => onRetry(item.content, item.clientRequestId)}
                    variant="secondary"
                  >
                    Coba ulang
                  </Button>
                ) : null}
              </div>
            ) : undefined
          }
          key={item.clientRequestId}
          role="USER"
        />
      ))}
      {busy ? (
        <p className="text-xs text-tp-muted" role="status">
          Asisten sedang menyusun jawaban…
        </p>
      ) : null}
      {quotaMessage ? (
        <p className="text-xs text-tp-ink-peach" role="status">
          {quotaMessage}
        </p>
      ) : null}
    </div>
  );
}
