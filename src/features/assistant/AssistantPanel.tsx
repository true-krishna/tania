"use client";

import * as React from "react";
import { IconPlus } from "@tabler/icons-react";
import { Button } from "@/components/Button";
import { CHIP_VARIANTS } from "@/components/Chip";
import { useSessionRole } from "@/lib/auth/guard";
import { cn } from "@/lib/cn";
import { AssistantComposer } from "./AssistantComposer";
import { AssistantConversationList } from "./AssistantConversationList";
import { AssistantMessageThread } from "./AssistantMessageThread";
import { SAMPLE_QUESTIONS, type AssistantRole } from "./assistantConfig";
import { useAssistantChat } from "./useAssistantChat";

export function AssistantPanel({
  open,
  onClose,
  triggerRef,
}: {
  open: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}) {
  const role = useSessionRole();
  const assistantRole: AssistantRole | null =
    role === "CHAPTER" || role === "OPERATION" ? role : null;
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const chat = useAssistantChat({ open, role: assistantRole });

  React.useEffect(() => {
    if (open && assistantRole) inputRef.current?.focus();
  }, [open, assistantRole]);

  function closeAndRestoreFocus() {
    onClose();
    triggerRef?.current?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      closeAndRestoreFocus();
    }
  }

  if (!open || !assistantRole) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        aria-label="Tutup asisten"
        className="absolute inset-0 bg-tp-midnight/40 transition-opacity duration-200 starting:opacity-0 motion-reduce:transition-none"
        onClick={closeAndRestoreFocus}
        tabIndex={-1}
        type="button"
      />
      <section
        aria-label="Asisten data Tania"
        aria-modal="true"
        className="relative flex h-full w-full flex-col border-l border-tp-line bg-tp-surface shadow-card transition-transform duration-200 starting:translate-x-6 motion-reduce:transition-none min-[861px]:w-[440px]"
        onKeyDown={handleKeyDown}
        role="dialog"
      >
        <header className="flex items-center justify-between gap-3 border-b border-tp-line px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-tp-text">
              Asisten Data
            </h2>
            <p className="text-xs text-tp-muted">
              Jawaban berdasar data dalam hak akses Anda (
              {assistantRole === "CHAPTER" ? "Chapter" : "Operation"}).
            </p>
          </div>
          <Button onClick={chat.startNewConversation} variant="secondary">
            <IconPlus aria-hidden size={16} /> Percakapan baru
          </Button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
          <AssistantConversationList
            activeId={chat.activeId}
            error={chat.conversations.error ?? null}
            hasData={Boolean(chat.conversations.data)}
            loading={chat.conversations.loading}
            nodes={chat.conversationNodes}
            onSelect={chat.setSelectedId}
          />

          <AssistantMessageThread
            activeId={chat.activeId}
            activePending={chat.activePending}
            busy={chat.busy}
            error={chat.messages.error ?? null}
            hasData={Boolean(chat.messages.data)}
            loading={chat.messages.loading}
            onRetry={chat.retry}
            quotaMessage={chat.quota?.message ?? null}
            thread={chat.thread}
            unanswered={chat.unanswered}
          />

          <div>
            <p className="mb-2 text-xs font-semibold text-tp-muted">
              Pertanyaan contoh
            </p>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_QUESTIONS[assistantRole].map((question) => (
                <button
                  className={cn("tp-chip", CHIP_VARIANTS.neutral, "text-left")}
                  key={question}
                  onClick={() => chat.setDraft(question)}
                  type="button"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        </div>

        <AssistantComposer
          busy={chat.busy}
          draft={chat.draft}
          inputRef={inputRef}
          onChange={chat.setDraft}
          onSend={() => void chat.handleSend()}
          quotaActive={Boolean(chat.quota)}
        />
      </section>
    </div>
  );
}
