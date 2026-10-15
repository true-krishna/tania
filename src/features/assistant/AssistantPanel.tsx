"use client";

import * as React from "react";
import { useMutation, useQuery, type ApolloError } from "@apollo/client";
import { IconPlus, IconSend } from "@tabler/icons-react";
import {
  ChatConversationsDocument,
  ChatMessagesDocument,
  CreateChatConversationDocument,
  SendChatMessageDocument,
} from "@/generated/graphql";
import { Button } from "@/components/Button";
import { EmptyState, ErrorState, LoadingState } from "@/components/DataState";
import { Input } from "@/components/Input";
import { useToast } from "@/components/Toast";
import { cn } from "@/lib/cn";
import { CHIP_VARIANTS } from "@/components/Chip/Chip";
import { useSessionRole } from "@/lib/auth/guard";
import { errorMessage, errorRetryAfterSeconds, graphQLErrorCode } from "@/lib/errors";

/** Batas panjang pesan (FR-10) — konstanta kontrak, bukan env. */
export const CHAT_MAX_LENGTH = 2000;

/** Peran yang melihat asisten (FR-01). Otorisasi sebenarnya ada di server. */
export type AssistantRole = "CHAPTER" | "OPERATION";

/**
 * Chip pertanyaan contoh per peran (kontrak UI · plan D8). Setiap contoh
 * dipetakan ke toolset read-only yang benar-benar tersedia bagi peran itu
 * (`ringkas_data`, `chatMessages`), sehingga semuanya dapat dijawab dan tidak
 * menjanjikan yang tidak di-ground.
 */
export const SAMPLE_QUESTIONS: Record<AssistantRole, readonly string[]> = {
  CHAPTER: [
    "Ringkas kondisi karyawan dan kontrak di cakupan chapter saya",
    "Siapa saja yang kontraknya berakhir dalam 90 hari?",
    "Karyawan mana yang perlu ditindaklanjuti kontraknya?",
    "Siapa saja yang data dirinya belum lengkap?",
  ],
  OPERATION: [
    "Ringkas kondisi seluruh karyawan dan kontrak",
    "Berapa jumlah karyawan aktif di seluruh unit?",
    "Siapa saja yang kontraknya berakhir dalam 90 hari?",
    "Siapa saja yang data dirinya belum lengkap?",
  ],
};

type AnswerBlock =
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] };

/**
 * Parser subset format jawaban (plan D7/R-8): bold `**…**`, daftar `-`/`*`,
 * daftar bernomor, dan baris baru. Menghasilkan struktur data — bukan HTML —
 * supaya renderer tidak pernah menyuntikkan markup dari keluaran model
 * (keluaran model bukan teks tepercaya).
 */
export function parseAnswer(text: string): AnswerBlock[] {
  const blocks: AnswerBlock[] = [];
  let bullets: string[] = [];
  let ordered: string[] = [];

  const flush = () => {
    if (bullets.length) {
      blocks.push({ kind: "ul", items: bullets });
      bullets = [];
    }
    if (ordered.length) {
      blocks.push({ kind: "ol", items: ordered });
      ordered = [];
    }
  };

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    const bullet = /^[-*]\s+(.*)$/.exec(line);
    const numbered = /^\d+[.)]\s+(.*)$/.exec(line);
    if (bullet) {
      if (ordered.length) flush();
      bullets.push(bullet[1]);
    } else if (numbered) {
      if (bullets.length) flush();
      ordered.push(numbered[1]);
    } else {
      flush();
      if (line) blocks.push({ kind: "p", text: line });
    }
  }
  flush();
  return blocks;
}

/** `**tebal**` → `<strong>`; sisanya simpul teks. Tidak ada `dangerouslySetInnerHTML`. */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  return text
    .split("**")
    .map((part, index) =>
      index % 2 === 1 ? <strong key={`${keyPrefix}-b${index}`}>{part}</strong> : part,
    );
}

export function AnswerText({ text }: { text: string }) {
  const blocks = React.useMemo(() => parseAnswer(text), [text]);
  return (
    <div className="flex flex-col gap-2 text-sm leading-relaxed">
      {blocks.map((block, index) => {
        const key = `blk-${index}`;
        if (block.kind === "ul") {
          return (
            <ul key={key} className="list-disc pl-5">
              {block.items.map((item, i) => (
                <li key={`${key}-${i}`}>{renderInline(item, `${key}-${i}`)}</li>
              ))}
            </ul>
          );
        }
        if (block.kind === "ol") {
          return (
            <ol key={key} className="list-decimal pl-5">
              {block.items.map((item, i) => (
                <li key={`${key}-${i}`}>{renderInline(item, `${key}-${i}`)}</li>
              ))}
            </ol>
          );
        }
        return <p key={key}>{renderInline(block.text, key)}</p>;
      })}
    </div>
  );
}

/** Kiriman user yang belum dikonfirmasi server (bubble optimistis). */
type PendingSend = {
  clientRequestId: string;
  content: string;
  status: "sending" | "failed";
};

type ChatMessageNode = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  clientRequestId?: string | null;
};

/** Semua USER di ekor thread tanpa balasan ASSISTANT setelahnya. */
export function unansweredUserMessages(messages: readonly ChatMessageNode[]): ChatMessageNode[] {
  let lastAssistant = -1;
  messages.forEach((message, index) => {
    if (message.role === "ASSISTANT") lastAssistant = index;
  });
  return messages.filter(
    (message, index) =>
      message.role === "USER" && index > lastAssistant && !!message.clientRequestId,
  );
}

function newClientRequestId(): string {
  return crypto.randomUUID();
}

function Bubble({ role, children }: { role: "USER" | "ASSISTANT"; children: React.ReactNode }) {
  const isUser = role === "USER";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")} data-role={role}>
      <div
        className={cn(
          "max-w-[85%] rounded-tp-lg px-4 py-3",
          isUser ? "bg-tp-brand-red-tint text-tp-text" : "border border-tp-line bg-tp-bg",
        )}
      >
        {children}
      </div>
    </div>
  );
}

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

  const { pushToast } = useToast();
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null | undefined>(undefined);
  const [draft, setDraft] = React.useState("");
  const [pending, setPending] = React.useState<Record<string, PendingSend[]>>({});
  // Penolakan kuota per jam (FR-13) bukan sekadar toast: selama jendela belum
  // bergeser, kirim dinonaktifkan dan tombol "coba ulang" disembunyikan —
  // mengulang sekarang hanya akan ditolak lagi (kontrak chat §Kontrak error).
  const [quota, setQuota] = React.useState<{ message: string; retryAfterSeconds: number } | null>(
    null,
  );

  const conversations = useQuery(ChatConversationsDocument, {
    skip: !open || !assistantRole,
    fetchPolicy: "cache-and-network",
  });

  // `undefined` = ikuti percakapan terbaru; `null` = "Percakapan baru" (thread kosong).
  const defaultConversationId =
    conversations.data?.chatConversations.edges[0]?.node.id ?? null;
  const activeId = selectedId === undefined ? defaultConversationId : selectedId;

  const messages = useQuery(ChatMessagesDocument, {
    variables: { conversationId: activeId ?? "" },
    skip: !open || !assistantRole || !activeId,
    fetchPolicy: "cache-and-network",
  });

  const [createConversation] = useMutation(CreateChatConversationDocument);
  const [sendMessage, sendState] = useMutation(SendChatMessageDocument);

  // Fokus pindah ke input saat panel dibuka (Design §VI).
  React.useEffect(() => {
    if (open && assistantRole) inputRef.current?.focus();
  }, [open, assistantRole]);

  // Percakapan terbaru dimuat otomatis agar riwayat langsung tampil.

  const quotaWaitMs = (quota?.retryAfterSeconds ?? 0) * 1000;
  React.useEffect(() => {
    if (!quota) return;
    const timer = window.setTimeout(() => setQuota(null), Math.max(quotaWaitMs, 1000));
    return () => window.clearTimeout(timer);
  }, [quota, quotaWaitMs]);

  const activePending = activeId ? (pending[activeId] ?? []) : [];

  function closeAndRestoreFocus() {
    onClose();
    triggerRef?.current?.focus();
  }

  async function deliver(conversationId: string, content: string, clientRequestId: string) {
    setPending((prev) => {
      const list = prev[conversationId] ?? [];
      const exists = list.some((item) => item.clientRequestId === clientRequestId);
      const next = exists
        ? list.map((item) =>
            item.clientRequestId === clientRequestId
              ? { ...item, status: "sending" as const }
              : item,
          )
        : [...list, { clientRequestId, content, status: "sending" as const }];
      return { ...prev, [conversationId]: next };
    });

    try {
      await sendMessage({ variables: { conversationId, content, clientRequestId } });
      setPending((prev) => ({
        ...prev,
        [conversationId]: (prev[conversationId] ?? []).filter(
          (item) => item.clientRequestId !== clientRequestId,
        ),
      }));
      setQuota(null);
      // Percakapan yang sudah tampil perlu dimuat ulang agar balasan server
      // masuk; percakapan yang baru dibuat termuat sendiri saat aktif.
      if (conversationId === activeId) await messages.refetch();
    } catch (error) {
      setPending((prev) => ({
        ...prev,
        [conversationId]: (prev[conversationId] ?? []).map((item) =>
          item.clientRequestId === clientRequestId
            ? { ...item, status: "failed" as const }
            : item,
        ),
      }));
      const apolloError = error as ApolloError;
      if (graphQLErrorCode(apolloError) === "CHAT_RATE_LIMITED") {
        setQuota({
          message: errorMessage(apolloError, "Batas pertanyaan per jam tercapai."),
          retryAfterSeconds: errorRetryAfterSeconds(apolloError) ?? 0,
        });
        return;
      }
      pushToast(
        "error",
        errorMessage(apolloError, "Asisten gagal menjawab. Silakan coba lagi."),
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
        if (!conversationId) throw new Error("percakapan baru tidak mengembalikan id");
        setSelectedId(conversationId);
      } catch (error) {
        pushToast(
          "error",
          errorMessage(error as ApolloError, "Percakapan baru gagal dibuat. Silakan coba lagi."),
        );
        return;
      }
    }

    // `clientRequestId` dibuat sekali per kiriman dan dipakai ulang saat coba
    // ulang (S2) — idempoten, termasuk setelah panel dimuat ulang.
    const clientRequestId = newClientRequestId();
    setDraft("");
    void deliver(conversationId, content, clientRequestId);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      closeAndRestoreFocus();
    }
  }

  if (!open || !assistantRole) return null;

  const conversationNodes =
    conversations.data?.chatConversations.edges.map((edge) => edge.node) ?? [];
  // Server mengirim terbaru lebih dulu; thread dirender kronologis.
  const thread = activeId
    ? [...(messages.data?.chatMessages.edges.map((edge) => edge.node) ?? [])].reverse()
    : [];
  const unanswered = unansweredUserMessages(thread);
  const busy = sendState.loading || activePending.some((item) => item.status === "sending");
  const overLimit = draft.length > CHAT_MAX_LENGTH;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        type="button"
        aria-label="Tutup asisten"
        tabIndex={-1}
        onClick={closeAndRestoreFocus}
        className="absolute inset-0 bg-tp-midnight/40 transition-opacity duration-200 starting:opacity-0 motion-reduce:transition-none"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Asisten data Tania"
        onKeyDown={handleKeyDown}
        className="relative flex h-full w-full flex-col border-l border-tp-line bg-tp-surface shadow-card transition-transform duration-200 starting:translate-x-6 motion-reduce:transition-none min-[861px]:w-[440px]"
      >
        <header className="flex items-center justify-between gap-3 border-b border-tp-line px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-tp-text">Asisten Data</h2>
            <p className="text-xs text-tp-muted">
              Jawaban berdasar data dalam hak akses Anda (
              {assistantRole === "CHAPTER" ? "Chapter" : "Operation"}).
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              setSelectedId(null);
              setDraft("");
            }}
          >
            <IconPlus size={16} aria-hidden /> Percakapan baru
          </Button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
          <div>
            <p className="mb-2 text-xs font-semibold text-tp-muted">Percakapan saya</p>
            {conversations.loading && !conversations.data ? (
              <LoadingState label="Memuat percakapan…" />
            ) : conversations.error ? (
              <ErrorState message={errorMessage(conversations.error, "Gagal memuat percakapan.")} />
            ) : conversationNodes.length === 0 ? (
              <EmptyState message="Belum ada percakapan. Ajukan pertanyaan pertama Anda." />
            ) : (
              <ul className="flex flex-wrap gap-2">
                {conversationNodes.map((conversation) => (
                  <li key={conversation.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(conversation.id)}
                      aria-current={conversation.id === activeId ? "true" : undefined}
                      className={cn(
                        "tp-chip",
                        conversation.id === activeId
                          ? "border border-tp-line bg-tp-brand-red-tint text-tp-brand-red-ink"
                          : CHIP_VARIANTS.neutral,
                      )}
                    >
                      {conversation.messageCount} pesan
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-1 flex-col gap-3">
            {activeId && messages.loading && !messages.data ? (
              <LoadingState label="Memuat riwayat…" />
            ) : activeId && messages.error ? (
              <ErrorState
                message={errorMessage(
                  messages.error,
                  "Percakapan tidak ditemukan atau bukan milik Anda.",
                )}
              />
            ) : thread.length === 0 && activePending.length === 0 ? (
              <EmptyState message="Mulai dengan salah satu pertanyaan contoh di bawah." />
            ) : (
              <div className="flex flex-col gap-3">
                {thread.map((message) => (
                  <Bubble key={message.id} role={message.role}>
                    {message.role === "ASSISTANT" ? (
                      <AnswerText text={message.content} />
                    ) : (
                      <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                    )}
                    {unanswered.some((item) => item.id === message.id) && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-tp-ink-peach">
                        <span>Belum terjawab</span>
                        {!quota && (
                          <Button
                            variant="secondary"
                            className="text-xs"
                            onClick={() =>
                              void deliver(activeId!, message.content, message.clientRequestId!)
                            }
                          >
                            Coba ulang
                          </Button>
                        )}
                      </div>
                    )}
                  </Bubble>
                ))}
                {activePending.map((item) => (
                  <Bubble key={item.clientRequestId} role="USER">
                    <p className="whitespace-pre-wrap text-sm">{item.content}</p>
                    {item.status === "failed" && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-tp-ink-peach">
                        <span>Belum terkirim</span>
                        {!quota && (
                          <Button
                            variant="secondary"
                            className="text-xs"
                            onClick={() =>
                              void deliver(activeId!, item.content, item.clientRequestId)
                            }
                          >
                            Coba ulang
                          </Button>
                        )}
                      </div>
                    )}
                  </Bubble>
                ))}
                {busy && (
                  <p role="status" className="text-xs text-tp-muted">
                    Asisten sedang menyusun jawaban…
                  </p>
                )}
                {quota && (
                  <p role="status" className="text-xs text-tp-ink-peach">
                    {quota.message}
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-tp-muted">Pertanyaan contoh</p>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_QUESTIONS[assistantRole].map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => setDraft(question)}
                  className={cn("tp-chip", CHIP_VARIANTS.neutral, "text-left")}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        </div>

        <footer className="border-t border-tp-line px-5 py-4">
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="assistant-input">
              Pertanyaan untuk asisten
            </label>
            <Input
              id="assistant-input"
              ref={inputRef}
              value={draft}
              maxLength={CHAT_MAX_LENGTH}
              disabled={busy}
              placeholder="Tulis pertanyaan tentang karyawan atau kontrak…"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleSend();
                }
              }}
            />
            <Button
              onClick={() => void handleSend()}
              disabled={busy || !!quota || !draft.trim() || overLimit}
              aria-label="Kirim pertanyaan"
            >
              <IconSend size={16} aria-hidden />
            </Button>
          </div>
          <p className="mt-2 text-xs text-tp-muted">
            {draft.length}/{CHAT_MAX_LENGTH} karakter
            {overLimit && " — maksimal 2.000 karakter."}
          </p>
        </footer>
      </section>
    </div>
  );
}
