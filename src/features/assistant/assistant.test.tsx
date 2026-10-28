// @vitest-environment jsdom

import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MockedProvider, type MockedResponse } from "@apollo/client/testing";
import { GraphQLError } from "graphql";
import { ToastProvider } from "@/components/Toast";
import {
  ChatConversationsDocument,
  ChatMessagesDocument,
  SendChatMessageDocument,
} from "@/generated/graphql";
import { AssistantBubble } from "./AssistantBubble";
import { AnswerText, unansweredUserMessages } from "./AssistantPanel";
import { MenuAccessProvider } from "@/lib/auth/access";

// Peran datang dari guard sesi (dipakai bubble & panel).
const auth = vi.hoisted(() => ({ role: "CHAPTER" as string | null }));
vi.mock("@/lib/auth/guard", () => ({
  useSessionRole: () => auth.role,
  AuthGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

/** `clientRequestId` deterministik supaya mock bisa mencocokkan variable persis. */
const FIXED_UUID = "11111111-1111-4111-8111-111111111111" as const;

const CONVERSATION = {
  __typename: "ChatConversation" as const,
  id: "conv-1",
  startedAt: "2026-10-01T08:00:00Z",
  lastMessageAt: "2026-10-01T08:05:00Z",
  messageCount: 2,
};

type MessageSeed = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  clientRequestId?: string | null;
};

const CONVERSATIONS_MOCK: MockedResponse = {
  request: { query: ChatConversationsDocument, variables: { first: 20 } },
  result: {
    data: {
      chatConversations: {
        __typename: "ChatConversationConnection",
        totalCount: 1,
        pageInfo: { __typename: "PageInfo", hasNextPage: false, endCursor: "c-1" },
        edges: [{ __typename: "ChatConversationEdge", cursor: "c-1", node: CONVERSATION }],
      },
    },
  },
};

function messagesMock(nodes: MessageSeed[]): MockedResponse {
  return {
    request: { query: ChatMessagesDocument, variables: { conversationId: "conv-1", first: 50 } },
    result: {
      data: {
        chatMessages: {
          __typename: "ChatMessageConnection",
          totalCount: nodes.length,
          pageInfo: { __typename: "PageInfo", hasNextPage: false, endCursor: "m-1" },
          // Server mengirim terbaru lebih dulu.
          edges: [...nodes].reverse().map((node, index) => ({
            __typename: "ChatMessageEdge",
            cursor: `m-${index}`,
            node: {
              __typename: "ChatMessage",
              inputTokens: node.role === "ASSISTANT" ? 100 : null,
              outputTokens: node.role === "ASSISTANT" ? 200 : null,
              clientRequestId: node.clientRequestId ?? null,
              createdAt: "2026-10-01T08:05:00Z",
              ...node,
            },
          })),
        },
      },
    },
  };
}

function assistantNode(id: string, content: string) {
  return {
    __typename: "ChatMessage" as const,
    id,
    role: "ASSISTANT" as const,
    content,
    inputTokens: 100,
    outputTokens: 200,
    clientRequestId: null,
    createdAt: "2026-10-01T08:06:00Z",
  };
}

function sendMock(question: string, clientRequestId: string, reply: MessageSeed): MockedResponse {
  return {
    request: {
      query: SendChatMessageDocument,
      variables: { conversationId: "conv-1", content: question, clientRequestId },
    },
    result: { data: { sendChatMessage: assistantNode(reply.id, reply.content) } },
  };
}

function renderAssistant(mocks: MockedResponse[]) {
  return render(
    <MockedProvider mocks={mocks}>
      <ToastProvider>
        <AssistantBubble />
      </ToastProvider>
    </MockedProvider>,
  );
}

/** Buka panel dan tunggu daftar percakapan termuat (agar `activeId` terisi). */
async function openPanelWithConversation() {
  fireEvent.click(screen.getByRole("button", { name: "Buka asisten data" }));
  const dialog = await screen.findByRole("dialog", { name: "Asisten data Tania" });
  await screen.findByRole("button", { name: "2 pesan" });
  return dialog;
}

function submit(question: string) {
  fireEvent.change(screen.getByLabelText("Pertanyaan untuk asisten"), {
    target: { value: question },
  });
  fireEvent.click(screen.getByRole("button", { name: "Kirim pertanyaan" }));
}

beforeEach(() => {
  auth.role = "CHAPTER";
  vi.spyOn(crypto, "randomUUID").mockReturnValue(FIXED_UUID);
});

afterEach(() => {
  vi.restoreAllMocks();
  auth.role = "CHAPTER";
});

describe("T028 — panel & bubble asisten", () => {
  it("tidak merender panel/bubble untuk ADMIN dan TALENT (guard peran)", () => {
    for (const role of ["ADMIN", "TALENT", null]) {
      auth.role = role;
      const { unmount } = renderAssistant([]);
      expect(screen.queryByRole("button", { name: "Buka asisten data" })).toBeNull();
      expect(screen.queryByRole("dialog")).toBeNull();
      unmount();
    }
  });

  it("mengikuti sel myMenuConfig (sumber sel hidup), bukan daftar peran statis", () => {
    // ADMIN dibuka oleh konfigurasi: bubble tampil meski default-nya NONE.
    auth.role = "ADMIN";
    const opened = render(
      <MockedProvider mocks={[]}>
        <ToastProvider>
          <MenuAccessProvider
            config={{ ADMIN: { assistant: { visible: true, accessLevel: "READ" } } }}
            roleName="ADMIN"
          >
            <AssistantBubble />
          </MenuAccessProvider>
        </ToastProvider>
      </MockedProvider>,
    );
    expect(screen.getByRole("button", { name: "Buka asisten data" })).toBeInTheDocument();
    opened.unmount();

    // CHAPTER ditutup oleh konfigurasi: bubble hilang meski default-nya READ.
    auth.role = "CHAPTER";
    render(
      <MockedProvider mocks={[]}>
        <ToastProvider>
          <MenuAccessProvider
            config={{ CHAPTER: { assistant: { visible: false, accessLevel: "NONE" } } }}
            roleName="CHAPTER"
          >
            <AssistantBubble />
          </MenuAccessProvider>
        </ToastProvider>
      </MockedProvider>,
    );
    expect(screen.queryByRole("button", { name: "Buka asisten data" })).toBeNull();
  });

  it("membuka panel dari bubble, memindahkan fokus ke input, dan menutup dengan Escape", async () => {
    renderAssistant([CONVERSATIONS_MOCK, messagesMock([])]);
    const dialog = await openPanelWithConversation();

    expect(screen.getByLabelText("Pertanyaan untuk asisten")).toHaveFocus();

    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: "Buka asisten data" })).toHaveFocus();
  });

  it("menampilkan chip pertanyaan contoh yang berbeda per peran", async () => {
    auth.role = "CHAPTER";
    const { unmount } = renderAssistant([CONVERSATIONS_MOCK, messagesMock([])]);
    await openPanelWithConversation();
    expect(screen.getByRole("button", { name: /di cakupan chapter saya/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /seluruh unit/i })).toBeNull();
    unmount();

    auth.role = "OPERATION";
    renderAssistant([CONVERSATIONS_MOCK, messagesMock([])]);
    await openPanelWithConversation();
    expect(screen.getByRole("button", { name: /seluruh unit/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /di cakupan chapter saya/i })).toBeNull();
  });

  it("menampilkan bubble user optimistis lalu balasan asisten", async () => {
    const question = "Berapa karyawan aktif di unit Platform?";
    const answer = "Ada **12** karyawan aktif.";

    renderAssistant([
      CONVERSATIONS_MOCK,
      messagesMock([]),
      sendMock(question, FIXED_UUID, { id: "msg-2", role: "ASSISTANT", content: answer }),
      messagesMock([
        { id: "msg-1", role: "USER", content: question, clientRequestId: FIXED_UUID },
        { id: "msg-2", role: "ASSISTANT", content: answer },
      ]),
    ]);

    await openPanelWithConversation();
    submit(question);

    // Bubble user tampil optimistis dari input lokal, tanpa menunggu server.
    expect(screen.getByText(question)).toBeInTheDocument();

    expect(await screen.findByText("12")).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText(question)).toHaveLength(1));
  });

  it("memuat riwayat percakapan setelah panel dimuat ulang", async () => {
    renderAssistant([
      CONVERSATIONS_MOCK,
      messagesMock([
        { id: "msg-1", role: "USER", content: "Ringkas data kontrak", clientRequestId: "req-1" },
        { id: "msg-2", role: "ASSISTANT", content: "Berikut ringkasannya." },
      ]),
    ]);

    await openPanelWithConversation();
    expect(await screen.findByText("Ringkas data kontrak")).toBeInTheDocument();
    expect(screen.getByText("Berikut ringkasannya.")).toBeInTheDocument();
    // Pesan yang sudah dijawab tidak ditandai "belum terjawab".
    expect(screen.queryByText("Belum terjawab")).toBeNull();
  });

  it("menandai pesan user tanpa balasan dan mengulang dengan clientRequestId yang sama", async () => {
    const question = "Siapa yang kontraknya berakhir?";
    const reply = { id: "msg-2", role: "ASSISTANT" as const, content: "Dua orang." };

    renderAssistant([
      CONVERSATIONS_MOCK,
      messagesMock([{ id: "msg-1", role: "USER", content: question, clientRequestId: "req-77" }]),
      // Mock hanya cocok bila coba ulang memakai id kiriman semula ("req-77").
      sendMock(question, "req-77", reply),
      messagesMock([
        { id: "msg-1", role: "USER", content: question, clientRequestId: "req-77" },
        reply,
      ]),
    ]);

    await openPanelWithConversation();
    expect(await screen.findByText("Belum terjawab")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Coba ulang" }));

    expect(await screen.findByText("Dua orang.")).toBeInTheDocument();
    expect(screen.queryByText("Belum terjawab")).toBeNull();
  });

  it("memblokir input lebih dari 2.000 karakter tanpa memanggil mutation", async () => {
    renderAssistant([CONVERSATIONS_MOCK, messagesMock([])]);

    await openPanelWithConversation();
    fireEvent.change(screen.getByLabelText("Pertanyaan untuk asisten"), {
      target: { value: "x".repeat(2100) },
    });

    expect(screen.getByText(/maksimal 2\.000 karakter\./i)).toBeInTheDocument();
    const sendButton = screen.getByRole("button", { name: "Kirim pertanyaan" });
    expect(sendButton).toBeDisabled();
    fireEvent.click(sendButton);

    // Tanpa mock mutation: panggilan apa pun akan memunculkan toast kegagalan.
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
    expect(screen.queryByText("Asisten sedang menyusun jawaban…")).toBeNull();
  });

  it("menampilkan state gagal yang ramah dan bubble tetap bisa dicoba ulang", async () => {
    const question = "Ping";
    renderAssistant([
      CONVERSATIONS_MOCK,
      messagesMock([]),
      {
        request: {
          query: SendChatMessageDocument,
          variables: { conversationId: "conv-1", content: question, clientRequestId: FIXED_UUID },
        },
        result: {
          errors: [
            new GraphQLError("Asisten belum dikonfigurasi.", {
              extensions: { code: "INTERNAL" },
            }),
          ],
        },
      },
    ]);

    await openPanelWithConversation();
    submit(question);

    expect(await screen.findByRole("alert")).toHaveTextContent("Asisten belum dikonfigurasi.");
    expect(screen.getByText("Belum terkirim")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Coba ulang" })).toBeInTheDocument();
  });

  it("menampilkan state kuota tercapai: pesan server, kirim nonaktif, coba ulang disembunyikan", async () => {
    const question = "Ping";
    const refusal =
      "kuota asisten tercapai (maksimum 20 pertanyaan per jam). Coba lagi dalam 12 menit.";
    renderAssistant([
      CONVERSATIONS_MOCK,
      messagesMock([]),
      {
        request: {
          query: SendChatMessageDocument,
          variables: { conversationId: "conv-1", content: question, clientRequestId: FIXED_UUID },
        },
        result: {
          errors: [
            new GraphQLError(refusal, {
              extensions: { code: "CHAT_RATE_LIMITED", retryAfterSeconds: 720 },
            }),
          ],
        },
      },
    ]);

    await openPanelWithConversation();
    submit(question);

    // Pesan Indonesia dari server ditampilkan apa adanya (bukan kode/label).
    expect(await screen.findByText(refusal)).toBeInTheDocument();
    expect(screen.getByText("Belum terkirim")).toBeInTheDocument();
    // Mengulang sekarang hanya akan ditolak lagi: tombolnya disembunyikan.
    expect(screen.queryByRole("button", { name: "Coba ulang" })).toBeNull();
    fireEvent.change(screen.getByLabelText("Pertanyaan untuk asisten"), {
      target: { value: "Pertanyaan lain" },
    });
    expect(screen.getByRole("button", { name: "Kirim pertanyaan" })).toBeDisabled();
  });
});

describe("T028 — renderer jawaban (tanpa raw HTML)", () => {
  it("merender bold, daftar, dan baris baru sebagai elemen React", () => {
    const { container } = render(
      <AnswerText text={"Ada **12** karyawan.\n- Satu\n- Dua\n1. Tiga"} />,
    );
    expect(container.querySelector("strong")).toHaveTextContent("12");
    expect(container.querySelectorAll("ul li")).toHaveLength(2);
    expect(container.querySelectorAll("ol li")).toHaveLength(1);
  });

  it("tidak pernah merender markup dari keluaran model sebagai HTML", () => {
    const injected = "<img src=x onerror=alert(1)>";
    const { container } = render(<AnswerText text={`Data **aman** ${injected}`} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain(injected);
  });

  it("menganggap hanya USER di ekor thread yang belum terjawab", () => {
    const answered = [
      { id: "1", role: "USER" as const, content: "a", clientRequestId: "r1" },
      { id: "2", role: "ASSISTANT" as const, content: "b" },
    ];
    expect(unansweredUserMessages(answered)).toHaveLength(0);
    expect(
      unansweredUserMessages([
        ...answered,
        { id: "3", role: "USER" as const, content: "c", clientRequestId: "r2" },
      ]),
    ).toHaveLength(1);
  });
});
